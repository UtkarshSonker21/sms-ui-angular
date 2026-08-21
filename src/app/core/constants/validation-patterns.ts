export class ValidationPatterns {

  /**
   * EMAIL
   *
   * Allowed:
   * - john@example.com
   * - john.doe@example.co.uk
   * - john+test@example.com
   * - student@university.ac.tz
   *
   * Not allowed:
   * - john@example
   * - john@
   * - @example.com
   * - john @example.com
   * - john@example..com
   */
  static readonly email =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;


  /**
   * PHONE NUMBER
   *
   * International format with country code.
   * Expected format: +CountryCode + Number
   *
   * Allowed:
   * - +919876543210
   * - +255712345678
   * - +447911123456
   * - +14155552671
   * - +971501234567
   *
   * Not allowed:
   * - 9876543210          (country code missing)
   * - +91 9876543210      (space not allowed)
   * - +91-9876543210      (hyphen not allowed)
   * - +0123456789         (country code cannot start with 0)
   * - +91                  (incomplete number)
   */
  static readonly phone =
    /^\+[1-9]\d{7,14}$/;


  /**
   * NAME
   *
   * Allows Unicode letters and a single space between words.
   * Suitable for first name, middle name and last name.
   *
   * Allowed:
   * - John
   * - John Doe
   * - Mary Jane
   * - Abdul Rahman
   * - José
   * - François
   * - Müller
   * - محمد
   * - محمد علي
   *
   * Not allowed:
   * -  John              (leading space)
   * - John               (trailing space)
   * - John  Doe          (multiple spaces)
   * - John123            (numbers)
   * - John-Doe           (hyphen)
   * - John_Doe           (underscore)
   * - John@Doe           (special character)
   */
  static readonly name =
    /^\p{L}+(?: \p{L}+)*$/u;


}
