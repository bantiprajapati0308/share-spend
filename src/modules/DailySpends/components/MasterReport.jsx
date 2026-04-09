import React from 'react';
import MasterReport from '../MasterReport';

/**
 * Legacy MasterReport wrapper
 * Redirects to the new modular MasterReport component
 * Kept for backward compatibility
 */

function MasterReportWrapper(props) {
    return <MasterReport {...props} />;
}

export default MasterReportWrapper;
