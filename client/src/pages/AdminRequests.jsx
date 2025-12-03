import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/admin/requests');
            // Filter out requests where patient data might be missing
            const validRequests = response.data.requests.filter(req => req.patient);
            setRequests(validRequests);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.post(`/admin/requests/${id}/approve`);
            toast.success('Request approved');
            // Notify sidebar to update count
            window.dispatchEvent(new Event('request-updated'));
            fetchRequests();
        } catch (error) {
            toast.error('Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        try {
            await axios.post(`/admin/requests/${id}/reject`);
            toast.success('Request rejected');
            // Notify sidebar to update count
            window.dispatchEvent(new Event('request-updated'));
            fetchRequests();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const formatChanges = (request) => {
        const changes = request.requestedChanges;
        const patient = request.patient || {};

        return Object.entries(changes).map(([key, newValue]) => {
            const oldValue = patient[key];

            // Handle nested objects (like emergencyContact)
            if (typeof newValue === 'object' && newValue !== null) {
                return (
                    <div key={key} className="mb-4 col-span-2">
                        <span className="font-semibold capitalize text-gray-700 block mb-2">{key}:</span>
                        <div className="pl-4 border-l-2 border-gray-200">
                            {Object.entries(newValue).map(([subKey, subNewValue]) => {
                                const subOldValue = oldValue ? oldValue[subKey] : 'N/A';
                                if (JSON.stringify(subOldValue) === JSON.stringify(subNewValue)) return null;

                                return (
                                    <div key={subKey} className="grid grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Old {subKey}</span>
                                            <div className="text-red-500 line-through">{String(subOldValue || 'N/A')}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">New {subKey}</span>
                                            <div className="text-green-600 font-medium">{String(subNewValue)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Skip if value hasn't changed (though backend should only send changes)
            if (oldValue === newValue) return null;

            return (
                <div key={key} className="bg-white p-3 rounded border border-gray-200">
                    <span className="font-semibold capitalize text-gray-700 block mb-2">{key}</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-xs text-gray-500 uppercase">Old Value</span>
                            <div className="text-red-500 line-through break-all">{String(oldValue || 'N/A')}</div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 uppercase">New Value</span>
                            <div className="text-green-600 font-medium break-all">{String(newValue)}</div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Requests</h1>
                            <p className="text-gray-600">Manage patient information update requests</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                                <p className="text-gray-500 text-lg">No pending requests found</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {requests.map((request) => (
                                    <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Patient: {request.patient?.fullName || 'Unknown'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Requested by: {request.hospital?.name || 'Unknown Hospital'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(request.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleReject(request._id)}
                                                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(request._id)}
                                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Requested Changes</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formatChanges(request)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminRequests;
