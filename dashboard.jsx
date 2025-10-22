import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, Clock, RefreshCw, Search, Filter, X } from 'lucide-react';

const Dashboard = () => {
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cameraFilter, setCameraFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Supabase Configuration - UPDATE THESE
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

  // Fetch violations from Supabase
  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/violations?order=timestamp.desc&limit=100`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch violations');
      
      const data = await response.json();
      setViolations(data);
      setFilteredViolations(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching violations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription to new violations
  useEffect(() => {
    fetchViolations();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchViolations, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filter violations
  useEffect(() => {
    let filtered = violations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.plate_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.camera_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Camera filter
    if (cameraFilter !== 'all') {
      filtered = filtered.filter(v => v.camera_id === cameraFilter);
    }

    setFilteredViolations(filtered);
  }, [searchTerm, statusFilter, cameraFilter, violations]);

  // Update violation status
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/violations?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh violations
      fetchViolations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Get unique cameras
  const cameras = ['all', ...new Set(violations.map(v => v.camera_id))];

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats calculation
  const stats = {
    total: violations.length,
    new: violations.filter(v => v.status === 'new').length,
    noPlate: violations.filter(v => v.plate_text === 'no_plate_detected' || v.plate_text === 'unreadable').length,
    detected: violations.filter(v => v.plate_text && v.plate_text !== 'no_plate_detected' && v.plate_text !== 'unreadable').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Parking Violations</h1>
                <p className="text-sm text-gray-500">Real-time monitoring dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="text-gray-500">Last updated</div>
                <div className="text-gray-900 font-medium">{formatTime(lastUpdate)}</div>
              </div>
              <button
                onClick={fetchViolations}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Violations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Alerts</p>
                <p className="text-3xl font-bold text-red-600">{stats.new}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Plates Detected</p>
                <p className="text-3xl font-bold text-green-600">{stats.detected}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No Plate Detected</p>
                <p className="text-3xl font-bold text-orange-600">{stats.noPlate}</p>
              </div>
              <X className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search plate number or camera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {cameras.map(cam => (
                <option key={cam} value={cam}>
                  {cam === 'all' ? 'All Cameras' : cam}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Violations List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {loading && violations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading violations...</p>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No violations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredViolations.map((violation) => {
              const isNoPlate = violation.plate_text === 'no_plate_detected' || violation.plate_text === 'unreadable';
              
              return (
                <div
                  key={violation.id}
                  onClick={() => setSelectedViolation(violation)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {violation.scene_url ? (
                      <img
                        src={violation.scene_url}
                        alt="Violation scene"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {isNoPlate && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        No Plate Detected
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{violation.camera_id}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(violation.status)}`}>
                        {violation.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">License Plate</p>
                      <p className={`text-lg font-bold ${isNoPlate ? 'text-orange-600' : 'text-gray-900'}`}>
                        {isNoPlate ? 'Cannot Extract' : violation.plate_text || 'N/A'}
                      </p>
                    </div>

                    {violation.confidence !== null && violation.confidence > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Detection Confidence</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${violation.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{(violation.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatTime(violation.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Violation Details</h2>
              <button
                onClick={() => setSelectedViolation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Scene Image */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Scene Image</h3>
                  {selectedViolation.scene_url ? (
                    <img
                      src={selectedViolation.scene_url}
                      alt="Scene"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Plate Image */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">License Plate</h3>
                  {selectedViolation.plate_url ? (
                    <img
                      src={selectedViolation.plate_url}
                      alt="Plate"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-200">
                      <div className="text-center">
                        <X className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                        <p className="text-orange-700 font-semibold">No Plate Extracted</p>
                        <p className="text-orange-600 text-sm">YOLO could not detect a license plate</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Camera ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedViolation.camera_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Timestamp</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(selectedViolation.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Plate Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedViolation.plate_text === 'no_plate_detected' || selectedViolation.plate_text === 'unreadable' 
                      ? 'Cannot Extract' 
                      : selectedViolation.plate_text || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedViolation.confidence ? `${(selectedViolation.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Update Status</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedViolation.id, 'new')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    New
                  </button>
                  <button
                    onClick={() => updateStatus(selectedViolation.id, 'reviewed')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  >
                    Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(selectedViolation.id, 'resolved')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
