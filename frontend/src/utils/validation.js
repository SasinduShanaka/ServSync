// 🔁 Reusable frontend validation utilities for complaints & feedback
// ⚙️ Keeps all validation logic centralized to keep components lightweight and clean.

// ==================== BASIC VALIDATION HELPERS ====================

// 📧 Validates that an email is present and has a valid format
export function validateEmail(value) {
  // If the email field is empty
  if (!value) return 'Email is required';
  // Simple regex to check email format
  const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
  // If it doesn't match the email pattern
  if (!re.test(value)) return 'Invalid email format';
  // If everything is fine, return null (no error)
  return null;
}

// 🧾 Checks if a field is required (not empty)
export function validateRequired(value, label = 'This field') {
  // If the field is missing or only contains spaces
  if (!value || !value.toString().trim()) return `${label} is required`;
  // No error
  return null;
}

// 🔤 Ensures a field meets a minimum character length
export function validateMinLength(value, min, label = 'Field') {
  // If the field exists but has fewer characters than required
  if (value && value.trim().length < min) return `${label} must be at least ${min} characters`;
  // No error
  return null;
}

// ==================== VALIDATION BUILDER ====================

// 🧩 Generic builder function that creates a validator from a set of rules
export function buildValidator(rules) {
  // Rules format: { fieldName: [{ test: fn, label?: string }] }
  return (data) => {
    const errors = {}; // Object to store field-specific error messages
    // Iterate over each field and its associated validators
    Object.entries(rules).forEach(([field, validators]) => {
      for (const v of validators) {
        // Run each test function on the field value
        const msg = v.test(data[field], data);
        // If a test returns an error message
        if (msg) {
          errors[field] = msg; // Store the message under that field
          break; // Stop at the first validation error for this field
        }
      }
    });
    // Return all collected errors
    return errors;
  };
}

// ==================== SPECIFIC VALIDATORS ====================

// 📝 Complaint form validation rules
export const complaintValidator = buildValidator({
  name: [
    { test: (v) => validateRequired(v, 'Name') }, // Required check
    { test: (v) => validateMinLength(v, 2, 'Name') } // Minimum length of 2
  ],
  email: [
    { test: (v) => validateEmail(v) } // Must be a valid email
  ],
  branch: [
    { test: (v) => (!v ? 'Branch is required' : null) } // Required field
  ],
  category: [
    { test: (v) => (!v ? 'Category is required' : null) } // Required field
  ],
  description: [
    { test: (v) => validateRequired(v, 'Description') }, // Required check
    { test: (v) => validateMinLength(v, 10, 'Description') } // At least 10 characters
  ]
});

// 💬 Feedback form validation rules
export const feedbackValidator = buildValidator({
  fullName: [
    { test: (v) => validateRequired(v, 'Full name') } // Required check
  ],
  email: [
    { test: (v) => validateEmail(v) } // Must be a valid email
  ],
  message: [
    { test: (v) => validateRequired(v, 'Message') }, // Required field
    { test: (v) => validateMinLength(v, 5, 'Message') } // At least 5 characters
  ],
  rating: [
    { test: (v) => (Number(v) > 0 ? null : 'Rating is required') } // Must be greater than 0
  ]
});
