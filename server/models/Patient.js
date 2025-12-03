const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const patientSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [0, 'Age must be positive'],
        max: [150, 'Invalid age']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    photoUrl: {
        type: String,
        trim: true,
        default: ''
    },
    bloodGroup: {
        type: String,
        required: [true, 'Blood group is required'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: {
        type: [String],
        default: []
    },
    medicalConditions: {
        type: [String],
        default: []
    },
    medications: {
        type: [String],
        default: []
    },
    emergencyContact: {
        name: {
            type: String,
            required: [true, 'Emergency contact name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Emergency contact phone is required'],
            trim: true,
            match: [/^[+]?[\d\s-()]+$/, 'Please provide a valid phone number']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
        }
    },
    riskLevel: {
        type: String,
        required: [true, 'Risk level is required'],
        enum: ['High', 'Medium', 'Low'],
        default: 'Low'
    },
    hospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: [true, 'Hospital is required']
    },
    qrToken: {
        type: String,
        unique: true,
        default: () => uuidv4()
    },
    qrCodeUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster qrToken lookups
patientSchema.index({ qrToken: 1 });

module.exports = mongoose.model('Patient', patientSchema);
