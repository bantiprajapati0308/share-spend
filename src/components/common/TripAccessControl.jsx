import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, Button } from 'react-bootstrap';
import { ShieldLock, ShieldCheck, Eye, EyeSlash } from 'react-bootstrap-icons';
import { setPasscodeAccess } from '../../redux/tripSlice';
import { verifyPasscode, tripHasPasscode } from '../../utils/tripPermissions';
import PasscodeModal from './PasscodeModal';

function TripAccessControl({ tripData, hasAccess, className = "" }) {
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const dispatch = useDispatch();

    const handlePasscodeSuccess = (enteredPasscode) => {
        const isValid = verifyPasscode(enteredPasscode, tripData.passcode);

        if (isValid) {
            dispatch(setPasscodeAccess({
                tripId: tripData.id,
                hasAccess: true
            }));
            return true;
        }

        return false;
    };

    const handleRequestAccess = () => {
        setShowPasscodeModal(true);
    };

    const handleViewOnlyMode = () => {
        // User explicitly chooses to stay in view-only mode
        dispatch(setPasscodeAccess({
            tripId: tripData.id,
            hasAccess: false
        }));
    };

    // If trip has no passcode, user always has access
    if (!tripHasPasscode(tripData)) {
        return null;
    }

    // If user already has access, show success status
    if (hasAccess) {
        return (
            <Alert variant="success" className={`d-flex align-items-center ${className}`}>
                <ShieldCheck size={20} className="me-2" />
                <span className="flex-grow-1">
                    You have full access to edit this trip.
                </span>
            </Alert>
        );
    }

    // User doesn't have access - show options
    return (
        <>
            <Alert variant="warning" className={`${className}`}>
                <div className="d-flex align-items-start">
                    <ShieldLock size={20} className="me-2 mt-1" />
                    <div className="flex-grow-1">
                        <div className="fw-semibold mb-2">This trip is protected</div>
                        <div className="small text-muted mb-3">
                            A passcode is required to add, edit, or delete expenses.
                            You can still view reports and export data.
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={handleRequestAccess}
                                className="d-flex align-items-center gap-1"
                            >
                                <ShieldLock size={14} />
                                Enter Passcode
                            </Button>
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={handleViewOnlyMode}
                                className="d-flex align-items-center gap-1"
                            >
                                <Eye size={14} />
                                View Only
                            </Button>
                        </div>
                    </div>
                </div>
            </Alert>

            <PasscodeModal
                show={showPasscodeModal}
                onHide={() => setShowPasscodeModal(false)}
                onSuccess={handlePasscodeSuccess}
                tripName={tripData.name}
                title="Enter Trip Passcode"
                message="Enter the passcode to get full access to edit expenses and trip details."
            />
        </>
    );
}

export default TripAccessControl;