import React, { useState } from "react";

const Form = ({ initialData = {}, onSubmit, fields }) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation: trim all string fields
    const validatedData = {};
    for (let key in formData) {
      validatedData[key] =
        typeof formData[key] === "string" ? formData[key].trim() : formData[key];
    }

    onSubmit(validatedData);
    setFormData({}); // reset form after submit
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-md shadow-md space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="font-medium mb-1">{field.label}:</label>

          {/* Select dropdown */}
          {field.type === "select" ? (
            <select
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select {field.label}</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-2 py-1"
            />
          ) : (
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded px-2 py-1"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
};

export default Form;
