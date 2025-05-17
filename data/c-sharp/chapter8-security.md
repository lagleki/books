# Security in C#

## Introduction

Security is a critical aspect of software development, especially when dealing with sensitive data and user information. In C#, security involves several key areas:

*   **Authentication:** Verifying the identity of a user or service.
*   **Authorization:** Determining what a user or service is allowed to access.
*   **Encryption:** Converting data into an unreadable format to protect its confidentiality.
*   **Hashing:** Creating a one-way function to transform data into a fixed-size string, often used for password storage.

## Interview Question

**Question:** Explain the difference between authentication and authorization.

## Detailed Answer

*   **Authentication** is the process of verifying who a user is. It's about confirming their identity. This is typically done by checking their credentials, such as a username and password.
*   **Authorization** is the process of determining what an authenticated user is allowed to do. It's about granting permissions and access rights. For example, an administrator might have authorization to access all parts of a system, while a regular user might only have access to certain features.

Common security vulnerabilities include:

*   **SQL Injection:** Exploiting vulnerabilities in database queries to gain unauthorized access to data.
*   **Cross-Site Scripting (XSS):** Injecting malicious scripts into websites to steal user data or perform actions on their behalf.
*   **Cross-Site Request Forgery (CSRF):** Tricking users into performing actions they didn't intend to, such as changing their password or making a purchase.
*   **Man-in-the-Middle (MITM) Attacks:** Intercepting communication between two parties to steal data or impersonate one of the parties.

## Code Example: Hashing and Salting

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

public class PasswordHasher
{
    public static string HashPassword(string password, out string salt)
    {
        // Generate a random salt
        salt = GenerateSalt();

        // Combine the password and salt
        string passwordWithSalt = password + salt;

        // Hash the password with SHA256
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(passwordWithSalt));

            // Convert the byte array to a hexadecimal string
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                builder.Append(hashBytes[i].ToString("x2"));
            }
            return builder.ToString();
        }
    }

    private static string GenerateSalt()
    {
        // Generate a random salt using RNGCryptoServiceProvider
        using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider())
        {
            byte[] saltBytes = new byte[16];
            rng.GetBytes(saltBytes);

            // Convert the byte array to a hexadecimal string
            return BitConverter.ToString(saltBytes).Replace("-", "");
        }
    }

    public static bool VerifyPassword(string password, string hash, string salt)
    {
        // Combine the password and salt
        string passwordWithSalt = password + salt;

        // Hash the password with SHA256
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(passwordWithSalt));

            // Convert the byte array to a hexadecimal string
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < hashBytes.Length; i++)
            {
                builder.Append(hashBytes[i].ToString("x2"));
            }
            string newHash = builder.ToString();

            // Compare the new hash with the stored hash
            return string.Equals(hash, newHash, StringComparison.OrdinalIgnoreCase);
        }
    }
}

// Example usage
public class Example
{
    public static void Main(string[] args)
    {
        string password = "mySecretPassword";
        string salt;
        string hash = PasswordHasher.HashPassword(password, out salt);

        Console.WriteLine("Hash: " + hash);
        Console.WriteLine("Salt: " + salt);

        bool verified = PasswordHasher.VerifyPassword(password, hash, salt);
        Console.WriteLine("Verified: " + verified);
    }
}
```

## Code Debugging Task: SQL Injection

Find and fix the vulnerability in the following code that allows for SQL injection.

```csharp
using System;
using System.Data.SqlClient;

public class Example
{
    public static void Main(string[] args)
    {
        string userInput = Console.ReadLine(); // Simulate user input

        // Vulnerable code
        string connectionString = "Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;";
        string query = "SELECT * FROM Users WHERE Username = '" + userInput + "'";

        using (SqlConnection connection = new SqlConnection(connectionString))
        {
            connection.Open();
            using (SqlCommand command = new SqlCommand(query, connection))
            {
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Console.WriteLine(reader["Username"] + " " + reader["Password"]);
                    }
                }
            }
        }
    }
}
```

## Explanation and Corrected Code

The vulnerability in the code is SQL injection. The `userInput` is directly concatenated into the SQL query without any sanitization or parameterization. This allows an attacker to inject malicious SQL code into the query, potentially gaining unauthorized access to the database.

To fix this, we should use parameterized queries. Parameterized queries prevent SQL injection by treating user input as data rather than executable code.

```csharp
using System;
using System.Data.SqlClient;

public class Example
{
    public static void Main(string[] args)
    {
        string userInput = Console.ReadLine(); // Simulate user input

        // Corrected code
        string connectionString = "Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;";
        string query = "SELECT * FROM Users WHERE Username = @Username";

        using (SqlConnection connection = new SqlConnection(connectionString))
        {
            connection.Open();
            using (SqlCommand command = new SqlCommand(query, connection))
            {
                // Add the parameter
                command.Parameters.AddWithValue("@Username", userInput);

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Console.WriteLine(reader["Username"] + " " + reader["Password"]);
                    }
                }
            }
        }
    }
}
```

In the corrected code, we use the `@Username` parameter in the SQL query and add the `userInput` as a parameter to the `SqlCommand`. This ensures that the user input is treated as data and not as part of the SQL query, preventing SQL injection.