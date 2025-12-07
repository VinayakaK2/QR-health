const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const OpenAI = require('openai');

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// @route   POST /api/ai/chat
// @desc    Patient-specific AI chatbot
// @access  Protected (PATIENT only)
router.post('/chat', authMiddleware, async (req, res) => {
    try {
        // Security: Only patients can use chatbot
        if (req.userRole !== 'PATIENT') {
            return res.status(403).json({
                success: false,
                message: 'Chatbot is only available for patients'
            });
        }

        if (!openai) {
            return res.status(503).json({
                success: false,
                message: 'AI service is currently unavailable'
            });
        }

        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get patient ID from JWT token (secure)
        const patientId = req.userPatientId || req.userId;

        // Fetch patient data
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Fetch recent reports (last 5)
        const recentReports = await Report.find({ patient: patientId })
            .sort({ reportDate: -1 })
            .limit(5)
            .select('reportType aiSummary riskLevel reportDate aiCategory');

        // Build patient context
        const patientContext = {
            profile: {
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies || [],
                medicalConditions: patient.medicalConditions || [],
                medications: patient.medications || [],
                riskLevel: patient.riskLevel
            },
            aiSummary: patient.aiSummary || 'No AI summary available yet',
            aiRiskLevel: patient.aiRiskLevel || 'Unknown',
            aiLifestyleAdvice: patient.aiLifestyleAdvice || [],
            recentReports: recentReports.map(r => ({
                type: r.reportType || r.aiCategory,
                date: r.reportDate,
                summary: r.aiSummary || 'No summary available',
                riskLevel: r.riskLevel || 'Unknown'
            }))
        };

        // System prompt with patient data
        const systemPrompt = `You are a helpful health assistant for ${patient.fullName}. Answer questions based ONLY on their medical data provided below.

PATIENT DATA:
${JSON.stringify(patientContext, null, 2)}

RULES:
1. Use ONLY this patient's data - never make up or assume information
2. If information is missing, say "This information is not available in your records"
3. Use simple, friendly, supportive language
4. Be concise but helpful
5. Always end responses with: "⚠️ This is not medical advice. For serious concerns, please consult your doctor."
6. If asked about symptoms or new issues not in the data, recommend seeing a doctor
7. Be encouraging about positive health behaviors`;

        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6), // Last 6 messages for context
            { role: 'user', content: message }
        ];

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        });

        const reply = completion.choices[0].message.content;

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat message',
            error: error.message
        });
    }
});

module.exports = router;
