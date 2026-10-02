'use client';
import AddCard from '@mui/icons-material/AddCard';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import { formatAmount } from '@tp/shared/format';
import type { PublicUser } from '@tp/shared/types';
import { memo } from 'react';

type Props = {
  user: PublicUser;
  flash: boolean;
  onAmount: (u: PublicUser) => void;
  onEdit: (u: PublicUser) => void;
  onDelete: (u: PublicUser) => void;
};

/** Memoised: a live update to one user re-renders one row, not the whole table. */
export const UserRow = memo(function UserRow({ user, flash, onAmount, onEdit, onDelete }: Props) {
  return (
    <TableRow hover className={`transition-colors duration-700 ${flash ? 'bg-emerald-50' : ''}`}>
      <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
      <TableCell>{user.city}</TableCell>
      <TableCell className="max-w-56 truncate">{user.email}</TableCell>
      <TableCell className="tabular whitespace-nowrap">{user.mobile}</TableCell>
      <TableCell align="right" className={`tabular whitespace-nowrap font-semibold ${flash ? 'text-credit' : ''}`}>
        {formatAmount(user.amount)}
      </TableCell>
      <TableCell align="right" className="whitespace-nowrap">
        <Tooltip title="Add amount">
          <IconButton size="small" color="success" onClick={() => onAmount(user)} aria-label={`Add amount for ${user.name}`}>
            <AddCard fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(user)} aria-label={`Edit ${user.name}`}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(user)} aria-label={`Delete ${user.name}`}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});
