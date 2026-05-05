import React, { useState, useEffect } from 'react';

const courseList = [
    {
        category: "College of Arts and Sciences",
        courses: [
            "Bachelor of Arts in Economics",
            "Bachelor of Arts in English Language",
            "Bachelor of Arts in Philosophy Pre-Law",
            "Bachelor of Arts in Philosophy Teaching Track",
            "Bachelor of Arts in Sociology",
            "Bachelor of Science in Biology Major in Biotechnology",
            "Bachelor of Science in Community Development",
            "Bachelor of Science in Development Communication",
            "Bachelor of Science in Environmental Science major in Environmental Heritage Studies",
            "Bachelor of Science in Mathematics",
            "Doctor of Philosophy in English Language",
            "Master of Arts in English Language",
            "Master of Arts in Guidance and Counseling",
            "Master of Arts in Sociology"
        ]
    },
    {
        category: "College of Business",
        courses: [
            "Bachelor of Science in Accountancy",
            "Bachelor of Science in Business Administration major in Financial Management",
            "Bachelor of Science in Hospitality Management",
            "Master of Business Administration"
        ]
    },
    {
        category: "College of Nursing",
        courses: ["Bachelor of Science in Nursing"]
    },
    {
        category: "College of Law",
        courses: ["Juris Doctor"]
    },
    {
        category: "College of Technologies",
        courses: [
            "Bachelor of Science in Automotive Technology",
            "Bachelor of Science in Electronics Technology",
            "Bachelor of Science in Entertainment and Multimedia Computing Major in Digital Animation Technology",
            "Bachelor of Science in Food Technology",
            "Bachelor of Science in Information Technology"
        ]
    },
    {
        category: "College of Public Administration and Governance",
        courses: ["Bachelor of Public Administration"]
    }
];

const allCoursesFlat = courseList.flatMap(c => c.courses);

const CourseSelect = ({ value, onChange, name, className, disabled, required = false }) => {
    const [isOther, setIsOther] = useState(false);
    
    // Check if the current value is NOT in the list (meaning it's a custom "Other" value)
    useEffect(() => {
        if (value && !allCoursesFlat.includes(value)) {
            setIsOther(true);
        } else {
            setIsOther(false);
        }
    }, [value]);

    const handleSelectChange = (e) => {
        const val = e.target.value;
        if (val === 'Other') {
            setIsOther(true);
            onChange({ target: { name, value: '' } }); // Reset actual value to empty so user can type
        } else {
            setIsOther(false);
            onChange({ target: { name, value: val } });
        }
    };

    const handleTextChange = (e) => {
        onChange({ target: { name, value: e.target.value } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            {!isOther ? (
                <select
                    name={name}
                    className={className}
                    value={value || ''}
                    onChange={handleSelectChange}
                    disabled={disabled}
                    required={required}
                    style={{ width: '100%' }}
                >
                    <option value="">Select Course...</option>
                    {courseList.map(category => (
                        <optgroup key={category.category} label={category.category}>
                            {category.courses.map(course => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </optgroup>
                    ))}
                    <option value="Other" style={{ fontWeight: 'bold' }}>Others: specify</option>
                </select>
            ) : (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <input
                        type="text"
                        name={name}
                        className={className}
                        placeholder="Please specify your course..."
                        value={value}
                        onChange={handleTextChange}
                        disabled={disabled}
                        required={required}
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <button 
                        type="button" 
                        onClick={() => {
                            setIsOther(false);
                            onChange({ target: { name, value: '' } });
                        }}
                        style={{
                            padding: '0 1rem',
                            background: 'var(--bg-body)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer'
                        }}
                        title="Back to list"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseSelect;
