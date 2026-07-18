let students = [
    { id: 1, name: "Mugisha Yvan", age: 18, gender: "male", grade: 11 },
    { id: 2, name: "Shimwa Jane", age: 17, gender: "female", grade: 10 },
    { id: 3, name: "Manzi Smith", age: 19, gender: "male", grade: 11 }
];

// question 1
function addStudent(name, age, gender, grade) {
    // Validations
    if (!name || name.trim() === "") {
        console.log("Error: Name must not be empty.");
        return;
    }
    if (typeof age !== 'number' || age <= 0) {
        console.log("Error: Age must be a number greater than 0.");
        return;
    }
    if (gender !== "male" && gender !== "female") {
        console.log("Error: Gender must be 'male' or 'female'.");
        return;
    }
    if (typeof grade !== 'number') {
        console.log("Error: Grade must be a number.");
        return;
    }
    
    // Check for duplicates
    const duplicate = students.some(student => student.name === name);
    if (duplicate) {
        console.log("Error: Student with this name already exists.");
        return;
    }

    // Generate new ID 
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    // Create and add the new student
    const newStudent = {
        id: newId,
        name: name,
        age: age,
        gender: gender,
        grade: grade
    };
    // Add to the list

    students.push(newStudent);
    console.log(`Success: Added ${name}`);
}

//question 2
function getStudents() {
    return students;
}

// b) Get student by id
function getStudentById(id) {
    const student = students.find(s => s.id === id);
    if (!student) {
        console.log("Student not found");
        return null; 
    }
    return student;
}

//question 3
function updateStudent(id, newName, newAge, newGender, newGrade) {
    const studentIndex = students.findIndex(s => s.id === id);

    // Validation: Student must exist
    if (studentIndex === -1) {
        console.log("Error: Student not found, cannot update.");
        return;
    }

    // Validation: Age
    if (typeof newAge !== 'number' || newAge <= 0) {
        console.log("Error: Invalid Age.");
        return;
    }

    // Validation: Gender
    if (newGender !== "male" && newGender !== "female") {
        console.log("Error: Gender must be 'male' or 'female'.");
        return;
    }

    // Update the student
    students[studentIndex] = {
        id: id, // ID must not be changed
        name: newName,
        age: newAge,
        gender: newGender,
        grade: newGrade
    };

    console.log(`Success: Updated student ${id}`);
}

//question 4
function deleteStudent(id) {
    const initialLength = students.length;
    // Filter out the student with the given ID
    students = students.filter(student => student.id !== id);
    // Check if a student was deleted
    if (students.length < initialLength) {
        console.log("Student deleted successfully.");
    } else {
        console.log("Student ID not found, nothing deleted.");
    }
}

//question 5

// a) Filter male students
function getMaleStudents() {
    return students.filter(student => student.gender === "male");
}

// b) Sort students by name 
function sortStudentsByName() {
    
   
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
}

// c) Show the oldest student
function getOldestStudent() {
    if (students.length === 0) return null;
    return students.reduce((oldest, current) => {
        return (current.age > oldest.age) ? current : oldest;
    });
}

// d) Count total number of students in Grade 11
function countGrade11Students() {
    return students.filter(student => student.grade === 11).length;
}

// Testing the functions
console.log("--- Initial List ---");
console.log(getStudents());

console.log("\n--- 1. Add Student (Keza) ---");
addStudent("Keza Anna", 16, "female", 10);
console.log(getStudents());

console.log("\n--- 2. Get Student By ID (2) ---");
console.log(getStudentById(2));

console.log("\n--- 3. Update Student (ID 1) ---");
updateStudent(1, "Mugisha Yvan Updated", 19, "male", 12);
console.log(getStudentById(1));

console.log("\n--- 4. Delete Student (ID 3) ---");
deleteStudent(3);

console.log("\n--- 5a. Male Students ---");
console.log(getMaleStudents());

console.log("\n--- 5b. Sorted by Name ---");
console.log(sortStudentsByName());

console.log("\n--- 5c. Oldest Student ---");
console.log(getOldestStudent());

console.log("\n--- 5d. Count Grade 11 ---");
console.log("Count:", countGrade11Students());
consolre.log("\n--- Final List ---");
console.log(getStudents());