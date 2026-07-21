import { useState } from 'react'

function UserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState(0)
  const [isStudent, setIsStudent] = useState(false)

  return (
    <form>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
        placeholder="Age"
      />
      <label>
        <input
          type="checkbox"
          checked={isStudent}
          onChange={(e) => setIsStudent(e.target.checked)}
        />
        Student?
      </label>

      <p>Hello {name}, {email}, age {age}, student: {isStudent ? 'Yes' : 'No'}</p>
    </form>
  )
}

export default UserForm;