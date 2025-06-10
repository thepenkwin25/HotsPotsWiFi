import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wuqjhtbmnlulrjninnql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // replace with your real anon key
)

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
    if (error) console.error(error)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>HotsPots Test App</h1>
      {user ? <p>Hello {user.email}</p> : <button onClick={signIn}>Sign in with Google</button>}
    </div>
  )
}
