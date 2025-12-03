const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const Patient = require('../models/Patient');
const PatientEditRequest = require('../models/PatientEditRequest');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// @route   GET /api/patients
// @desc    Get all patients (filtered by hospital for HOSPITAL_ADMIN)
// @access  Protected
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        let filter = {};

        // Hospital admins can only see their own patients
        if (req.userRole === 'HOSPITAL_ADMIN') {
            if (!req.userHospital) {
                return res.status(400).json({
                    success: false,
                    message: 'No hospital associated with this account'
                });
            }
            filter.hospital = req.userHospital;
        }

        const patients = await Patient.find(filter).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Protected
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        let filter = { _id: req.params.id };

        // Hospital admins can only see their own patients
        if (req.userRole === 'HOSPITAL_ADMIN') {
            filter.hospital = req.userHospital;
        }

        const patient = await Patient.findOne(filter);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            patient
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Protected
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        // For hospital admins, automatically set the hospital
        let patientData = req.body;
        if (req.userRole === 'HOSPITAL_ADMIN') {
            if (!req.userHospital) {
                return res.status(400).json({
                    success: false,
                    message: 'No hospital associated with this account'
                });
            }
            patientData.hospital = req.userHospital;
        }

        const patient = new Patient(patientData);
        await patient.save();

        // Generate QR code
        const qrData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/emergency/${patient.qrToken}`;
        const qrFileName = `qr-${patient.qrToken}.png`;
        const qrFilePath = path.join(uploadsDir, qrFileName);

        await QRCode.toFile(qrFilePath, qrData, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Update patient with QR code URL
        patient.qrCodeUrl = `/uploads/${qrFileName}`;
        await patient.save();

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            patient
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Protected
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
        let filter = { _id: req.params.id };

        // Hospital admins can only update their own patients
        if (req.userRole === 'HOSPITAL_ADMIN') {
            filter.hospital = req.userHospital;
        }

        const patient = await Patient.findOne(filter);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Update fields (except qrToken and hospital)
        const { qrToken, hospital, ...updateData } = req.body;

        // If HOSPITAL_ADMIN, create edit request instead of updating directly
        if (req.userRole === 'HOSPITAL_ADMIN') {
            const editRequest = new PatientEditRequest({
                patient: patient._id,
                hospital: req.userHospital,
                requestedChanges: updateData,
                status: 'PENDING'
            });
            await editRequest.save();

            return res.json({
                success: true,
                message: 'Update request sent to Admin for approval',
                requestPending: true
            });
        }

        // If SUPER_ADMIN, update directly
        Object.assign(patient, updateData);
        await patient.save();

        res.json({
            success: true,
            message: 'Patient updated successfully',
            patient
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Protected
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        let filter = { _id: req.params.id };

        // Hospital admins can only delete their own patients
        if (req.userRole === 'HOSPITAL_ADMIN') {
            filter.hospital = req.userHospital;
        }

        const patient = await Patient.findOne(filter);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Delete QR code file if exists
        if (patient.qrCodeUrl) {
            const qrFilePath = path.join(__dirname, '..', patient.qrCodeUrl);
            await fs.unlink(qrFilePath).catch(console.error);
        }

        await Patient.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Patient deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
