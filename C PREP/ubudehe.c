#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char nationalID[20];
    char names[100];
    char gender[10];
    char phone[15];
    char cell[50];
    char village[50];
    char startingDate[15];
} Person;

void addRecord();
void viewRecords();
void editRecord();
void deleteRecord();
void clearInputBuffer();

int main() {
    int choice;
    while (1) {
        printf("\n=== UBUDEHE Records Management (Mayange  Sector , Bugesera ) ===\n");
        printf("1. Add New Record\n");
        printf("2. View All Records\n");
        printf("3. Edit Existing Record\n");
        printf("4. Delete Record\n");
        printf("5. Exit\n");
        printf("Enter your choice: ");
        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Please enter a number.\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        switch (choice) {
            case 1: addRecord(); break;
            case 2: viewRecords(); break;
            case 3: editRecord(); break;
            case 4: deleteRecord(); break;
            case 5: exit(0);
            default: printf("Invalid choice. Try again.\n");
        }
    }
    return 0;
}

void clearInputBuffer() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

void addRecord() {
    FILE *fp = fopen("UBUDEHE.txt", "a");
    if (fp == NULL) {
        perror("Error opening file");
        return;
    }
    Person p;
    printf("Enter National ID: ");
    fgets(p.nationalID, sizeof(p.nationalID), stdin);
    p.nationalID[strcspn(p.nationalID, "\n")] = 0;

    printf("Enter Names: ");
    fgets(p.names, sizeof(p.names), stdin);
    p.names[strcspn(p.names, "\n")] = 0;

    printf("Enter Gender: ");
    fgets(p.gender, sizeof(p.gender), stdin);
    p.gender[strcspn(p.gender, "\n")] = 0;

    printf("Enter Phone: ");
    fgets(p.phone, sizeof(p.phone), stdin);
    p.phone[strcspn(p.phone, "\n")] = 0;

    printf("Enter Cell: ");
    fgets(p.cell, sizeof(p.cell), stdin);
    p.cell[strcspn(p.cell, "\n")] = 0;

    printf("Enter Village: ");
    fgets(p.village, sizeof(p.village), stdin);
    p.village[strcspn(p.village, "\n")] = 0;

    printf("Enter Starting Date (DD/MM/YYYY): ");
    fgets(p.startingDate, sizeof(p.startingDate), stdin);
    p.startingDate[strcspn(p.startingDate, "\n")] = 0;

    fprintf(fp, "%s|%s|%s|%s|%s|%s|%s\n", p.nationalID, p.names, p.gender, p.phone, p.cell, p.village, p.startingDate);
    fclose(fp);
    printf("Record added successfully.\n");
}

void viewRecords() {
    FILE *fp = fopen("UBUDEHE.txt", "r");
    if (fp == NULL) {
        printf("No records found.\n");
        return;
    }
    Person p;
    char line[300];
    printf("\n%-20s | %-20s | %-10s | %-15s | %-15s | %-15s | %-15s\n", 
           "National ID", "Names", "Gender", "Phone", "Cell", "Village", "Start Date");
    printf("------------------------------------------------------------------------------------------------------------------------\n");
    while (fgets(line, sizeof(line), fp)) {
        char *token = strtok(line, "|");
        if (token) strcpy(p.nationalID, token);
        token = strtok(NULL, "|");
        if (token) strcpy(p.names, token);
        token = strtok(NULL, "|");
        if (token) strcpy(p.gender, token);
        token = strtok(NULL, "|");
        if (token) strcpy(p.phone, token);
        token = strtok(NULL, "|");
        if (token) strcpy(p.cell, token);
        token = strtok(NULL, "|");
        if (token) strcpy(p.village, token);
        token = strtok(NULL, "\n");
        if (token) strcpy(p.startingDate, token);

        printf("%-20s | %-20s | %-10s | %-15s | %-15s | %-15s | %-15s\n", 
               p.nationalID, p.names, p.gender, p.phone, p.cell, p.village, p.startingDate);
    }
    fclose(fp);
}

void editRecord() {
    char targetID[20];
    printf("Enter National ID to edit: ");
    fgets(targetID, sizeof(targetID), stdin);
    targetID[strcspn(targetID, "\n")] = 0;

    FILE *fp = fopen("UBUDEHE.txt", "r");
    if (fp == NULL) {
        printf("No records found.\n");
        return;
    }

    FILE *tempFp = fopen("temp.txt", "w");
    char line[300];
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        char tempLine[300];
        strcpy(tempLine, line);
        char *id = strtok(tempLine, "|");
        
        if (id && strcmp(id, targetID) == 0) {
            found = 1;
            Person p;
            strcpy(p.nationalID, targetID);
            printf("Enter New Names: ");
            fgets(p.names, sizeof(p.names), stdin);
            p.names[strcspn(p.names, "\n")] = 0;

            printf("Enter New Gender: ");
            fgets(p.gender, sizeof(p.gender), stdin);
            p.gender[strcspn(p.gender, "\n")] = 0;

            printf("Enter New Phone: ");
            fgets(p.phone, sizeof(p.phone), stdin);
            p.phone[strcspn(p.phone, "\n")] = 0;

            printf("Enter New Cell: ");
            fgets(p.cell, sizeof(p.cell), stdin);
            p.cell[strcspn(p.cell, "\n")] = 0;

            printf("Enter New Village: ");
            fgets(p.village, sizeof(p.village), stdin);
            p.village[strcspn(p.village, "\n")] = 0;

            printf("Enter New Starting Date (DD/MM/YYYY): ");
            fgets(p.startingDate, sizeof(p.startingDate), stdin);
            p.startingDate[strcspn(p.startingDate, "\n")] = 0;

            fprintf(tempFp, "%s|%s|%s|%s|%s|%s|%s\n", p.nationalID, p.names, p.gender, p.phone, p.cell, p.village, p.startingDate);
        } else {
            fprintf(tempFp, "%s", line);
        }
    }
    fclose(fp);
    fclose(tempFp);

    if (found) {
        remove("UBUDEHE.txt");
        rename("temp.txt", "UBUDEHE.txt");
        printf("Record updated successfully.\n");
    } else {
        remove("temp.txt");
        printf("Record with ID %s not found.\n", targetID);
    }
}

void deleteRecord() {
    char targetID[20];
    printf("Enter National ID to delete: ");
    fgets(targetID, sizeof(targetID), stdin);
    targetID[strcspn(targetID, "\n")] = 0;

    FILE *fp = fopen("UBUDEHE.txt", "r");
    if (fp == NULL) {
        printf("No records found.\n");
        return;
    }

    FILE *tempFp = fopen("temp.txt", "w");
    char line[300];
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        char tempLine[300];
        strcpy(tempLine, line);
        char *id = strtok(tempLine, "|");
        
        if (id && strcmp(id, targetID) == 0) {
            found = 1;
            continue; // Skip writing this line to temp file
        } else {
            fprintf(tempFp, "%s", line);
        }
    }
    fclose(fp);
    fclose(tempFp);

    if (found) {
        remove("UBUDEHE.txt");
        rename("temp.txt", "UBUDEHE.txt");
        printf("Record deleted successfully.\n");
    } else {
        remove("temp.txt");
        printf("Record with ID %s not found.\n", targetID);
    }
}
