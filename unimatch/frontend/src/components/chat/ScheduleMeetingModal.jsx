import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import api from '../../services/api';

// Basic Modal Styling (replace with a proper modal library later if needed)
const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    zIndex: 1000,
    width: '90%',
    maxWidth: '500px',
};
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
};
const timeSlotStyle = {
    display: 'inline-block',
    border: '1px solid #ccc',
    borderRadius: '15px',
    padding: '5px 10px',
    margin: '5px',
    cursor: 'pointer',
    background: '#eee'
};
const selectedTimeSlotStyle = {
    ...timeSlotStyle,
    background: '#007bff',
    color: 'white',
    borderColor: '#0056b3'
};


const ScheduleMeetingModal = ({ matchId, onClose, onMeetingProposed }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [proposedSlots, setProposedSlots] = useState([]); // Array of {startTime, endTime} objects
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState(''); // Optional description
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Example predefined time slots for a selected date
    const availableTimes = [
        { label: '9:00 - 10:00', startHour: 9, endHour: 10 },
        { label: '10:00 - 11:00', startHour: 10, endHour: 11 },
        { label: '11:00 - 12:00', startHour: 11, endHour: 12 },
        { label: '13:00 - 14:00', startHour: 13, endHour: 14 },
        { label: '14:00 - 15:00', startHour: 14, endHour: 15 },
        { label: '15:00 - 16:00', startHour: 15, endHour: 16 },
        { label: '16:00 - 17:00', startHour: 16, endHour: 17 },
    ];

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setProposedSlots([]); // Clear selected slots when date changes
    };

    const handleSlotToggle = (slot) => {
        const slotDateTime = {
            startTime: new Date(selectedDate.setHours(slot.startHour, 0, 0, 0)),
            endTime: new Date(selectedDate.setHours(slot.endHour, 0, 0, 0))
        };

        setProposedSlots(prevSlots => {
            const exists = prevSlots.some(ps =>
                ps.startTime.getTime() === slotDateTime.startTime.getTime() &&
                ps.endTime.getTime() === slotDateTime.endTime.getTime()
            );
            if (exists) {
                return prevSlots.filter(ps =>
                    !(ps.startTime.getTime() === slotDateTime.startTime.getTime() &&
                      ps.endTime.getTime() === slotDateTime.endTime.getTime())
                );
            } else {
                // Limit number of proposals if needed
                // if (prevSlots.length >= 3) {
                //     alert("You can propose up to 3 time slots.");
                //     return prevSlots;
                // }
                return [...prevSlots, {startTime: slotDateTime.startTime, endTime: slotDateTime.endTime}]; // Ensure correct format
            }
        });
    };

    const isSlotSelected = (slot) => {
         const startTime = new Date(selectedDate.setHours(slot.startHour, 0, 0, 0)).getTime();
         return proposedSlots.some(ps => ps.startTime.getTime() === startTime);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (proposedSlots.length === 0 || !location.trim()) {
            setError('Please select at least one time slot and enter a location.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/meetings', {
                matchId,
                proposedSlots,
                location: location.trim(),
                description: description.trim() || undefined // Only send if not empty
            });
            onMeetingProposed(res.data); // Notify parent
            onClose(); // Close modal on success
    } catch (err) {
        console.error("Error proposing meeting:", err);
        // Display the specific message from the backend response if available
        const backendErrorMessage = err.response?.data?.message || 'Failed to propose meeting.';
        setError(backendErrorMessage);
    } finally {
        setLoading(false);
        }
    };


    return (
        <>
            <div style={overlayStyle} onClick={onClose}></div>
            <div style={modalStyle}>
                <h2>Propose Meeting</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {/* Date Picker */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Select Date:</label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            minDate={new Date()} // Prevent selecting past dates
                            dateFormat="yyyy/MM/dd"
                            inline // Display calendar directly
                        />
                    </div>

                    {/* Time Slots */}
                     <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Select Proposed Time Slots (for {selectedDate.toLocaleDateString()}):</label>
                        <div>
                            {availableTimes.map(slot => (
                                <span
                                    key={slot.label}
                                    style={isSlotSelected(slot) ? selectedTimeSlotStyle : timeSlotStyle}
                                    onClick={() => handleSlotToggle(slot)}
                                >
                                    {slot.label}
                                </span>
                            ))}
                        </div>
                    </div>

                     {/* Location */}
                     <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="location">Location:</label>
                        <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Online, Library Cafe Room 3"
                            required
                        />
                         {/* TODO: Add mini-map component here if desired */}
                    </div>

                     {/* Description (Optional) */}
                     <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="description">Description/Agenda (Optional):</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ textAlign: 'right' }}>
                        <button type="button" onClick={onClose} disabled={loading} style={{ marginRight: '10px', background: '#6c757d' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || proposedSlots.length === 0 || !location.trim()}>
                            {loading ? 'Proposing...' : 'Propose Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ScheduleMeetingModal;
