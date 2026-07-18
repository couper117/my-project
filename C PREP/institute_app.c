#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

// Function Prototypes
void mainMenu();
void miniCalculator();
void numberConverter();
void studentGrading();
void clearBuffer();
long long binaryToDecimal(const char *bin);
void decimalToBinary(long long dec, char *bin);

int main() {
    mainMenu();
    return 0;
}

void clearBuffer() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

void pressEnter() {
    printf("\nPress Enter to return to Main Menu...");
    while (getchar() != '\n');
}

void mainMenu() {
    int choice;
    do {
        printf("\n========================================\n");
        printf("       TECHNICAL INSTITUTE UTILITY      \n");
        printf("========================================\n");
        printf("1. Mini Calculator\n");
        printf("2. Number System Converter\n");
        printf("3. Student Grading Record\n");
        printf("4. Exit\n");
        printf("----------------------------------------\n");
        printf("Enter your choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Please enter a number.\n");
            clearBuffer();
            choice = 0;
            continue;
        }
        clearBuffer();

        switch (choice) {
            case 1:
                miniCalculator();
                pressEnter();
                break;
            case 2:
                numberConverter();
                pressEnter();
                break;
            case 3:
                studentGrading();
                pressEnter();
                break;
            case 4:
                printf("Exiting the program. Goodbye!\n");
                break;
            default:
                printf("Invalid choice. Please select 1-4.\n");
        }
    } while (choice != 4);
}

void miniCalculator() {
    double num1, num2, result;
    int op;

    printf("\n--- Mini Calculator ---\n");
    printf("Enter first number: ");
    if (scanf("%lf", &num1) != 1) {
        printf("Invalid input.\n");
        clearBuffer();
        return;
    }
    printf("Enter second number: ");
    if (scanf("%lf", &num2) != 1) {
        printf("Invalid input.\n");
        clearBuffer();
        return;
    }

    printf("\nSelect Operation:\n");
    printf("1. Addition (+)\n");
    printf("2. Subtraction (-)\n");
    printf("3. Multiplication (*)\n");
    printf("4. Division (/)\n");
    printf("Choice: ");
    if (scanf("%d", &op) != 1) {
        printf("Invalid input.\n");
        clearBuffer();
        return;
    }
    clearBuffer();

    switch (op) {
        case 1:
            result = num1 + num2;
            printf("Result: %.2lf + %.2lf = %.2lf\n", num1, num2, result);
            break;
        case 2:
            result = num1 - num2;
            printf("Result: %.2lf - %.2lf = %.2lf\n", num1, num2, result);
            break;
        case 3:
            result = num1 * num2;
            printf("Result: %.2lf * %.2lf = %.2lf\n", num1, num2, result);
            break;
        case 4:
            if (num2 == 0) {
                printf("Error: Division by zero is not allowed.\n");
            } else {
                result = num1 / num2;
                printf("Result: %.2lf / %.2lf = %.2lf\n", num1, num2, result);
            }
            break;
        default:
            printf("Invalid operation.\n");
    }
}

long long binaryToDecimal(const char *bin) {
    long long dec = 0;
    while (*bin) {
        if (*bin == '0' || *bin == '1') {
            dec = (dec << 1) | (*bin - '0');
        } else {
            return -1; // Invalid binary digit
        }
        bin++;
    }
    return dec;
}

void decimalToBinary(long long dec, char *bin) {
    if (dec == 0) {
        strcpy(bin, "0");
        return;
    }
    char temp[65];
    int i = 0;
    while (dec > 0) {
        temp[i++] = (dec % 2) + '0';
        dec /= 2;
    }
    temp[i] = '\0';
    // Reverse string
    int len = strlen(temp);
    for (int j = 0; j < len; j++) {
        bin[j] = temp[len - 1 - j];
    }
    bin[len] = '\0';
}

void numberConverter() {
    int type;
    char input[100];
    long long decimalValue = 0;
    char binaryStr[65];

    printf("\n--- Number System Converter ---\n");
    printf("Select Input Type:\n");
    printf("1. Binary\n");
    printf("2. Decimal\n");
    printf("3. Octal\n");
    printf("4. Hexadecimal\n");
    printf("Choice: ");
    if (scanf("%d", &type) != 1) {
        printf("Invalid input.\n");
        clearBuffer();
        return;
    }
    clearBuffer();

    printf("Enter the number: ");
    scanf("%s", input);
    clearBuffer();

    char *endptr;
    switch (type) {
        case 1: // Binary
            decimalValue = binaryToDecimal(input);
            if (decimalValue == -1) {
                printf("Error: Invalid binary number.\n");
                return;
            }
            break;
        case 2: // Decimal
            decimalValue = strtoll(input, &endptr, 10);
            break;
        case 3: // Octal
            decimalValue = strtoll(input, &endptr, 8);
            break;
        case 4: // Hexadecimal
            decimalValue = strtoll(input, &endptr, 16);
            break;
        default:
            printf("Invalid input type.\n");
            return;
    }

    decimalToBinary(decimalValue, binaryStr);

    printf("\nConversion Results:\n");
    printf("Binary:      %s\n", binaryStr);
    printf("Decimal:     %lld\n", decimalValue);
    printf("Octal:       %llo\n", decimalValue);
    printf("Hexadecimal: %llX\n", decimalValue);
}


void studentGrading() {
    char name[100];
    double score1, score2, score3, average;

    printf("\n--- Student Grading Record ---\n");
    printf("Enter Student Name: ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\n")] = 0;

    printf("Enter Score 1: ");
    if (scanf("%lf", &score1) != 1) { clearBuffer(); return; }
    printf("Enter Score 2: ");
    if (scanf("%lf", &score2) != 1) { clearBuffer(); return; }
    printf("Enter Score 3: ");
    if (scanf("%lf", &score3) != 1) { clearBuffer(); return; }
    clearBuffer();

    average = (score1 + score2 + score3) / 3.0;

    printf("\n--- Grading Result ---\n");
    printf("Student Name: %s\n", name);
    printf("Average Score: %.2lf\n", average);
}
