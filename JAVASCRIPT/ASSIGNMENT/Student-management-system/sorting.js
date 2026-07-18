// Sorting students by age in descending order and finding the oldest student (learning exercise)
let students = [
    { id: 1, name: "Mugisha Yvan", age: 18, gender: "male", grade: 11 },
    { id: 2, name: "Shimwa Jane", age: 17, gender: "female", grade: 10 },
    { id: 3, name: "Manzi Smith", age: 19, gender: "male", grade: 11 }
];
const sorted = students.sort((a,b) => b.age - a.age);
const oldest = sorted[0];
console.log(oldest);
// Function to get the oldest student
function getOldestStudent() {  
    if (students.length === 0) {
        console.log("No students available.");
        return null;
    }
    return students.reduce((oldest, current) => {
        return (current.age > oldest.age) ? current : oldest;
    });
}   
// Function to count students in grade 11