import React from 'react'
import { useInlineEdit } from '../../hooks/useInlineEdit'

/**
 * A table cell that turns into an input on double-click.
 *
 * Props:
 *   value      - current value
 *   onSave     - async fn(newValue) — called when the user commits
 *   type       - 'text' | 'number' | 'email' | 'date' | 'select'
 *   options    - array of { value, label } for type='select'
 *   editable   - whether editing is allowed (default true)
 *   formatter  - optional fn(value) → display string
 */
export default function EditableCell({
  value,
  onSave,
  type = 'text',
  options = [],
  editable = true,
  formatter,
}) {
  const edit = useInlineEdit(value, onSave)

  const display = formatter ? formatter(value) : (value ?? '—')

  if (!editable) {
    return <span style={{ color: 'var(--text)' }}>{display}</span>
  }

  if (edit.editing) {
    if (type === 'select') {
      return (
        <select
          ref={edit.inputProps.ref}
          value={edit.inputProps.value}
          onChange={edit.inputProps.onChange}
          onBlur={edit.inputProps.onBlur}
          onKeyDown={edit.inputProps.onKeyDown}
          className="editable-input"
          style={{ minWidth: '6rem' }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    return (
      <input
        {...edit.inputProps}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'email' ? 'email' : 'text'}
        style={{ minWidth: '5rem' }}
      />
    )
  }

  return (
    <span
      className="editable-cell"
      onDoubleClick={editable ? edit.startEdit : undefined}
      title={editable ? 'Doble clic para editar' : undefined}
    >
      {edit.saving ? <span className="spinner" /> : display}
    </span>
  )
}
