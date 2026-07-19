import { useState, useEffect } from 'react'

function CounterWithTimer() {
  const [count, setCount] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  // Format time into hh:mm:ss
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const resetAll = () => {
    setCount(0)
    setSeconds(0)
    setIsRunning(false)
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', width: '320px' }}>
      {/* Flex row for counter and timer with vertical line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setCount(count - 1)}>-</button>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>

        {/* Vertical line */}
        <div style={{ borderLeft: '1px solid #000', height: '50px', margin: '0 15px' }}></div>

        {/* Timer */}
        <div>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(seconds)}</span>
          <div>
            <button onClick={() => setIsRunning(true)}>Start</button>
          </div>
        </div>
      </div>

      {/* Line above reset */}
      <div style={{ borderTop: '1px solid #000', marginTop: '15px', paddingTop: '10px', textAlign: 'center' }}>
        <button onClick={resetAll}>Reset</button>
      </div>
    </div>
  )
}

export default CounterWithTimer