import React, { useState } from 'react';

export default function AuthForm({title, fields, onSubmit}) {
    const [values, setValues] = useState(
        Object.fromEntries(fields.map(f => [f.name, '']))
    );

    const handleChange = e =>
        setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        onSubmit(values);
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>{title}</h2>
            {fields.map(({name, label, type = 'text'}) => (
                <div key={name}>
                    <label>
                        {label}:
                        <input
                            name={name}
                            type={type}
                            value={values[name]}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>
            ))}
            <button type="submit">{title}</button>
        </form>
    )
};