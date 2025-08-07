import passwordValidator from 'password-validator';

const passwordSchema = new passwordValidator();

passwordSchema
  .is().min(8) // Minimum length 8
  .is().max(100) // Maximum length 100
  .has().uppercase() // Must have uppercase letters
  .has().lowercase() // Must have lowercase letters
  .has().digits() // Must have digits
  .has().not().spaces() // Should not have spaces
  .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist common passwords

const validatePassword = (password) => {
  return passwordSchema.validate(password);
};