import Drawer from '@mui/material/Drawer'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  children: React.ReactNode
}

export default function ConfirmDrawer({ open, onClose, onConfirm, children }: Props) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { style: { background: 'transparent' } } }}
    >
      <div className="routine-confirm-drawer">
        {children}
        <div className="routine-confirm-drawer__btns">
          <button type="button" className="btn btn--primary" onClick={onClose}>취소</button>
          <button type="button" className="btn btn--white" onClick={onConfirm}>확인</button>
        </div>
      </div>
    </Drawer>
  )
}
