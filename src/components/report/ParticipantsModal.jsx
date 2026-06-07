import React from 'react';
import { Button } from 'react-bootstrap';
import { PeopleFill } from 'react-bootstrap-icons';

function ParticipantsModal({ show, onClose, participants }) {
    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(33,150,243,0.15)' }} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content" style={{ borderRadius: 16, border: '2px solid #1de9b6', boxShadow: '0 4px 24px #2196f355' }}>
                    <div className="modal-header" style={{ background: 'linear-gradient(90deg, #1de9b6 0%, #2196f3 100%)', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                        <h5 className="modal-title">
                            <PeopleFill className="me-2" />Participants
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ background: '#f4f8ff' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {participants.map((participant, index) => (
                                <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px solid #e3f0ff', color: '#1769aa', fontWeight: 500 }}>
                                    <PeopleFill className="me-2" style={{ color: '#1de9b6' }} />
                                    {participant.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="modal-footer" style={{ background: '#e3f0ff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                        <Button variant="success" onClick={onClose} style={{ borderRadius: 8, fontWeight: 600 }}>
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParticipantsModal;