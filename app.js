import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export default function App() {
  const { loading, data, get, abort, error } = useRequest(() => {
    return new Promise(async (res, rej) => {
      await setTimeout(() => res({
        response: 'ok'
      }), 5000)
    })
  })

  const renderData = useMemo(() => data?.response, [data])

  return <div>
    {loading ? <div>LOADING...</div> : (
      <div>
        <span style={{ color: 'green' }}>{renderData}</span>
        <span style={{ color: 'red' }}>{error}</span>
      </div>
    )}
    <button onClick={() => get()} style={{ border: '1px solid black' }}>get</button>
    <button onClick={() => abort()} style={{ border: '1px solid black', marginLeft: 4 }}>abort</button>
  </div>
}

export const useRequest = (request, cb) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const ctrl = useRef({})

  const get = useCallback(async (...props) => {
    try {
      setLoading(true)
      ctrl.current = new AbortController()
      const data = await withSignal(() => request(ctrl.current.signal, ...props), { signal: ctrl.current.signal })
      setData(data)
      setError(null)
      setLoading(false)
      return {
        ...data,
        aborted: ctrl.current.signal.aborted
      }
    } catch (error) {
      setData(null)
      setError(error?.response || error.message)
      setLoading(false)
      cb?.(error)
      return Promise.reject(error)
    }
  }, [])
  useEffect(() => {
    return () => ctrl.current.signal?.removeEventListener("abort", () => null);
  }, [])

  return { loading, data, get, abort: () => ctrl.current.abort(), error }
}

function withSignal(request, { signal }) {
  return new Promise(async (resolve, reject) => {
    const abortHandler = () => {
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal?.addEventListener("abort", abortHandler);
    const data = await request()
    resolve(data)
  });
}