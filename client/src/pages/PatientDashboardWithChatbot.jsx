// Simple wrapper component for Patient Dashboard with AI Chatbot
// Just swap the import in App.jsx to use this instead of the regular PatientDashboard

import PatientDashboard from './PatientDashboard';
import AIChatBot from '../components/AIChatBot';

const PatientDashboardWithChatbot = () => {
    return (
        <>
            <PatientDashboard />
            <AIChatBot />
        </>
    );
};

export default PatientDashboardWithChatbot;
