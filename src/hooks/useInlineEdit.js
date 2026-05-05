import { useState, useRef, useEffect } from 'react'

/**
 * Hook for managing a single inline-editable field.
 *
 * Usage:
 *   const edit = useInlineEdit(value, async (newVal) => { await updateRow(id, { field: newVal }) })
 *
 *   <span onDoubleClick={edit.startEdit} ...>
 *     {edit.editing ? <input {...edit.inputProps} /> : value}
 *   </span>
 */
export function useInlineEdit(value, onSave) {
  const [editing, setEditing]         = useState(false)
  const [localValue, setLocalValue]   = useState(value)
  const [saving, setSaving]           = useState(false)
  const inputRef                      = useRef(null)

  // Keep local value in sync when parent value changes (e.g. after refetch)
  useEffect(() => {
    if (!editing) setLocalValue(value)
  }, [value, editing])

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = (e) => {
    e.preventDefault()
    setLocalValue(value ?? '')
    setEditing(true)
  }

  const save = async () => {
    if (localValue === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(localValue)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const cancel = () => {
    setLocalValue(value ?? '')
    setEditing(false)
  }

  const inputProps = {
    ref:      inputRef,
    value:    localValue ?? '',
    onChange: (e) => setLocalValue(e.target.value),
    onBlur:   save,
    onKeyDown: (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); save() }
      if (e.key === 'Escape') { e.preventDefault(); cancel() }
    },
    disabled: saving,
    className: 'editable-input',
  }

  return { editing, saving, startEdit, cancel, inputProps }
}
