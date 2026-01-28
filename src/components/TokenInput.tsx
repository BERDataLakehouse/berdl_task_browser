import React, { useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface ITokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
}

export const TokenInput: React.FC<ITokenInputProps> = ({
  token,
  onTokenChange
}) => {
  const [showToken, setShowToken] = useState(false);

  return (
    <Box
      sx={{ px: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Token (or 'mock')"
        type={showToken ? 'text' : 'password'}
        value={token}
        onChange={e => onTokenChange(e.target.value)}
        InputProps={{
          sx: {
            fontSize: '0.7rem',
            '& input': { py: 0.5, px: 1 }
          },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setShowToken(!showToken)}
                edge="end"
                sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <FontAwesomeIcon
                  icon={showToken ? faEyeSlash : faEye}
                  style={{ fontSize: '0.6rem' }}
                />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};
