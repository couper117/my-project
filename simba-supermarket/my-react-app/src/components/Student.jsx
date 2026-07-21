import React from "react";
function Students() {
    const [names,setNames] = useState(["john","jane","anne"]);
    return (
        <div>
            <ul>
                {names.map(name => (
                    <li> {name} </li>
                ))}
            </ul>
        </div>
    );
} 
export default Students;