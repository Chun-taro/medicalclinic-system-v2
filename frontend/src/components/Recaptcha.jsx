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

  // Debug: Check what key is being used
  console.log('reCAPTCHA Site Key:', process.env.REACT_APP_RECAPTCHA_SITE_KEY);

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
      onChange={handleVerify}
      onExpired={handleExpire}
      theme="light"
    />
  );
};

export default Recaptcha;
