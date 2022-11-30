import axios from 'axios'
import { useEffect, useState } from 'react'

import { validateProps } from './types'

export function isWindow(obj: any) {
  return obj !== null && obj !== undefined && obj === obj.window
}

export const getScroll = (target: HTMLElement | Window | Document | null, top: boolean): number => {
  if (typeof window === 'undefined') {
    return 0
  }
  const method = top ? 'scrollTop' : 'scrollLeft'
  let result = 0
  if (isWindow(target)) {
    result = (target as Window)[top ? 'pageYOffset' : 'pageXOffset']
  } else if (target instanceof Document) {
    result = target.documentElement[method]
  } else if (target) {
    result = (target as HTMLElement)[method]
  }
  if (target && !isWindow(target) && typeof result !== 'number') {
    result = ((target as HTMLElement).ownerDocument || (target as Document)).documentElement?.[method]
  }
  return result
}

export const useForm = (validate: any) => {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [shouldSubmit, setShouldSubmit] = useState(false)

  const handleSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors(validate(values))
    // Your url for API
    const url = ''
    if (Object.keys(values).length === 3) {
      axios
        .post(url, {
          ...values,
        })
        .then(() => {
          setShouldSubmit(true)
        })
    }
  }

  useEffect(() => {
    if (Object.keys(errors).length === 0 && shouldSubmit) {
      setValues('')
    }
  }, [errors, shouldSubmit])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist()
    setValues((values) => ({
      ...values,
      [event.target.name]: event.target.value,
    }))
    setErrors((errors) => ({ ...errors, [event.target.name]: '' }))
  }

  return {
    handleChange,
    handleSubmit,
    values,
    errors,
  }
}

export default function validate(values: validateProps) {
  const errors = {} as validateProps

  if (!values.name) {
    errors.name = 'Name is required'
  }
  if (!values.email) {
    errors.email = 'Email address is required'
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email address is invalid'
  }
  if (!values.message) {
    errors.message = 'Message is required'
  }
  return errors
}
