import React, { useState } from "react";

const Form = ({ initialData = {}, onSubmit, fields }) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      {fields.map((field) => (
        <div key={field.name} style={{ marginBottom: "10px" }}>
          <label>{field.label}: </label>
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            required
          />
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
