import React, { useState } from 'react'
import './Dropdown.css'
import { ChevronDown } from 'lucide-react';

const Dropdown = (props) => {
    const [selectedValue, setSelectedValue] = useState(`Select ${props.label}`)

    const handleSelect = (value) => {
        setSelectedValue(value);
        if (props.onSelect) {
            props.onSelect(value); // send value to parent
        }
    };

    return (
        <div className="dropdown sla-custom-dropdown-con">
            <h1 className="sla-drop-down-label">{props.label}</h1>
            <button
                className="btn btn-secondary dropdown-toggle sla-dropdown-btn w-100 d-flex justify-content-between align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                {selectedValue}
            </button>
            <ul className="dropdown-menu w-100 sla-dropdown-menu">
                {
                    props.data.map((item, index) => (
                        item.icon ? (
                            <li key={index} onClick={() => handleSelect(item.label)}>
                                <span>{item.iconlabel}</span>{item.label}
                            </li>
                        ) : (
                            <li key={index} onClick={() => handleSelect(item.label)}>
                                <span className='label-color' style={{ background: `${item.labelColor}` }}></span>{item.label}
                            </li>
                        )
                    ))
                }
            </ul>
        </div>
    )
}

export default Dropdown
