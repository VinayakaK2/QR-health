import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const PatientForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        age: '',
        gender: 'Male',
        photoUrl: '',
        bloodGroup: 'O+',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: {
            name: '',
            phone: '',
            email: ''
        },

    });

    useEffect(() => {
        if (isEditMode) {
            fetchPatient();
        }
    }, [id]);

    const fetchPatient = async () => {
        try {
            const response = await axios.get(`/patients/${id}`);
            const patient = response.data.patient;
            setFormData({
                fullName: patient.fullName,
                email: patient.email || '',
                age: patient.age,
                gender: patient.gender,
                photoUrl: patient.photoUrl || '',
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies.join(', '),
                medicalConditions: patient.medicalConditions.join(', '),
                medications: patient.medications.join(', '),
                emergencyContact: patient.emergencyContact,
                emergencyContact: patient.emergencyContact,
            });
        } catch (error) {
            toast.error('Failed to load patient data');
            navigate('/patients');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.fullName || !formData.age || !formData.emergencyContact.name || !formData.emergencyContact.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const submitData = {
                ...formData,
                age: parseInt(formData.age),
                allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
                medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
                medications: formData.medications ? formData.medications.split(',').map(s => s.trim()).filter(Boolean) : []
            };

            if (isEditMode) {
                const response = await axios.put(`/patients/${id}`, submitData);
                if (response.data.requestPending) {
                    toast.success('Update request sent to Admin for approval');
                } else {
                    toast.success('Patient updated successfully');
                }
            } else {
                await axios.post('/patients', submitData);
                toast.success('Patient created successfully');
            }

            navigate('/patients');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {isEditMode ? 'Edit Patient' : 'Add New Patient'}
                            </h1>
                            <p className="text-gray-600">
                                {isEditMode ? 'Update patient information' : 'Create a new patient record with QR code'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="card">
                            <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="patient@example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Age <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                className="input-field"
                                                min="0"
                                                max="150"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="input-field"
                                                required
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Blood Group <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="bloodGroup"
                                                value={formData.bloodGroup}
                                                onChange={handleChange}
                                                className="input-field"
                                                required
                                            >
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Photo URL (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                name="photoUrl"
                                                value={formData.photoUrl}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="https://example.com/photo.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Information */}
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Allergies (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                name="allergies"
                                                value={formData.allergies}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="Penicillin, Peanuts, Latex"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Medical Conditions (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                name="medicalConditions"
                                                value={formData.medicalConditions}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="Diabetes, Hypertension, Asthma"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Medications (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                name="medications"
                                                value={formData.medications}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="Metformin, Lisinopril, Aspirin"
                                            />
                                        </div>


                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="emergencyContact.name"
                                                value={formData.emergencyContact.name}
                                                onChange={handleChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="emergencyContact.phone"
                                                value={formData.emergencyContact.phone}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="+919876543210"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                name="emergencyContact.email"
                                                value={formData.emergencyContact.email}
                                                onChange={handleChange}
                                                className="input-field"
                                                placeholder="emergency@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/patients')}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </span>
                                        ) : (
                                            isEditMode ? 'Update Patient' : 'Create Patient'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PatientForm;
