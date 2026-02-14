import React, { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const Recaptcha = ({ onVerify, onExpire }) => {
    const recaptchaRef = useRef();

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
