const express = require('express');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/hospitals/register
// @desc    Register a new hospital (public)
// @access  Public
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, phone, address, primaryContactName, adminName, adminEmail, adminPassword } = req.body;

        // Validate required fields
        if (!name || !email || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if hospital email already exists
        const existingHospital = await Hospital.findOne({ email });
        if (existingHospital) {
            return res.status(400).json({
                success: false,
                message: 'Hospital with this email already exists'
            });
        }

        // Check if admin email already exists
        let adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
            if (adminUser.hospital) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already associated with another hospital'
                });
            }
        }

        // Create hospital
        const hospital = new Hospital({
            name,
            email,
            phone,
            address,
            primaryContactName,
            status: 'PENDING'
        });
        await hospital.save();

        // Create or update admin user
        if (adminUser) {
            adminUser.name = adminName;
            adminUser.password = adminPassword;
            adminUser.role = 'HOSPITAL_ADMIN';
            adminUser.hospital = hospital._id;
            adminUser.isActive = false;
            await adminUser.save();
        } else {
            adminUser = new User({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: 'HOSPITAL_ADMIN',
                hospital: hospital._id,
                isActive: false
            });
            await adminUser.save();
        }

        // Link admin user to hospital
        hospital.adminUser = adminUser._id;
        await hospital.save();

        res.status(201).json({
            success: true,
            message: 'Hospital registration submitted successfully. The system owner will review your application.',
            hospital: {
                id: hospital._id,
                name: hospital.name,
                status: hospital.status
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/hospitals
// @desc    Get all hospitals (with optional status filter)
// @access  Protected (SUPER_ADMIN only)
router.get('/', authMiddleware, requireSuperAdmin, async (req, res, next) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) {
            filter.status = status.toUpperCase();
        }

        const hospitals = await Hospital.find(filter)
            .populate('adminUser', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: hospitals.length,
            hospitals
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/hospitals/:id
// @desc    Get single hospital
// @access  Protected (SUPER_ADMIN only)
router.get('/:id', authMiddleware, requireSuperAdmin, async (req, res, next) => {
    try {
        const hospital = await Hospital.findById(req.params.id)
            .populate('adminUser', 'name email isActive');

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        res.json({
            success: true,
            hospital
        });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/hospitals/:id/approve
// @desc    Approve a hospital
// @access  Protected (SUPER_ADMIN only)
router.patch('/:id/approve', authMiddleware, requireSuperAdmin, async (req, res, next) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Update hospital status
        hospital.status = 'APPROVED';
        await hospital.save();

        // Activate the admin user
        if (hospital.adminUser) {
            await User.findByIdAndUpdate(hospital.adminUser, { isActive: true });
        }

        res.json({
            success: true,
            message: 'Hospital approved successfully',
            hospital
        });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/hospitals/:id/reject
// @desc    Reject a hospital
// @access  Protected (SUPER_ADMIN only)
router.patch('/:id/reject', authMiddleware, requireSuperAdmin, async (req, res, next) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        // Update hospital status
        hospital.status = 'REJECTED';
        await hospital.save();

        // Deactivate the admin user
        if (hospital.adminUser) {
            await User.findByIdAndUpdate(hospital.adminUser, { isActive: false });
        }

        res.json({
            success: true,
            message: 'Hospital rejected',
            hospital
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
