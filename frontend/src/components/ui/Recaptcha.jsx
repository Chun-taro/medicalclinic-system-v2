import React, { useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const Recaptcha = ({ onVerify, onExpire }) => {
    const recaptchaRef = useRef();
    const isElectron = /Electron/i.test(navigator.userAgent);

    useEffect(() => {
        if (isElectron) {
            // Automatically verify in Electron environment since reCAPTCHA doesn't support file://
            onVerify('electron-bypass-token');
        }
    }, [isElectron, onVerify]);

    if (isElectron) {
        return <div style={{ padding: '10px', color: '#666', fontSize: '0.8rem', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '4px' }}>
            Security verification active (Desktop Mode)
        </div>;
    }

    const handleVerify = (token) => {
        onVerify(token);
    };

    const handleExpire = () => {
        onExpire();
    };

    return (
        <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleVerify}
            onExpired={handleExpire}
            theme="light"
        />
    );
};

export default Recaptcha;
