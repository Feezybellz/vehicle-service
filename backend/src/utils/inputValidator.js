class inputValidator {
  constructor() {
    this.errors = {};
    this.messages = {}; // Store custom messages for each field
  }

  // Adds custom error message with optional dynamic field name
  withMessage(message, field) {
    this.messages[field] = message; // Store message for the specific field
    return this;
  }

  // Check if field is not empty
  notEmpty(fieldValue, field) {
    if (!fieldValue || fieldValue.trim() === "") {
      this.addError(
        field,
        `${this.messages[field] || `${field} cannot be empty`}`
      );
    }
    return this;
  }

  // Check if field is a number
  isNumber(fieldValue, field) {
    if (isNaN(fieldValue)) {
      this.addError(
        field,
        `${this.messages[field] || `${field} must be a number`}`
      );
    }
    return this;
  }

  // Check if field is a valid email
  isEmail(fieldValue, field) {
    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(fieldValue)) {
      this.addError(
        field,
        `${this.messages[field] || `${field} must be a valid email`}`
      );
    }
    return this;
  }

  // Check if field has a minimum length
  minLength(fieldValue, minLength, field) {
    if (fieldValue.length < minLength) {
      this.addError(
        field,
        `${
          this.messages[field] ||
          `${field} must be at least ${minLength} characters long`
        }`
      );
    }
    return this;
  }

  // Check if field has a maximum length
  maxLength(fieldValue, maxLength, field) {
    if (fieldValue.length > maxLength) {
      this.addError(
        field,
        `${
          this.messages[field] ||
          `${field} cannot exceed ${maxLength} characters`
        }`
      );
    }
    return this;
  }

  // Check if field is a valid date (YYYY-MM-DD)
  isDate(fieldValue, field) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
    if (!datePattern.test(fieldValue)) {
      this.addError(
        field,
        `${
          this.messages[field] || `${field} must be a valid date (YYYY-MM-DD)`
        }`
      );
    }
    return this;
  }

  // Check if field value is within a specific set of values
  isIn(fieldValue, values, field) {
    if (!values.includes(fieldValue)) {
      this.addError(
        field,
        `${
          this.messages[field] ||
          `${field} must be one of the following values: ${values.join(", ")}`
        }`
      );
    }
    return this;
  }

  isPassword(fieldValue, field) {
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (!passwordPattern.test(fieldValue)) {
      this.addError(
        field,
        `${
          this.messages[field] ||
          `${field} must contain at least one uppercase letter, one lowercase letter, and one number`
        }`
      );
    }
    return this;
  }

  // Check if a field passes a custom validation function
  customValidation(fieldValue, validationFn, field) {
    if (!validationFn(fieldValue)) {
      this.addError(
        field,
        `${this.messages[field] || `${field} failed custom validation`}`
      );
    }
    return this;
  }

  // Add error to the errors list
  addError(field, errorMessage) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(errorMessage);
  }

  // Get all errors
  getErrors() {
    return this.errors;
  }

  // Check if the validation has passed
  isValid() {
    return Object.keys(this.errors).length === 0;
  }
}

module.exports = inputValidator;
