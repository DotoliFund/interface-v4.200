import * as React from 'react';
import ButtonUnstyled, { buttonUnstyledClasses } from '@mui/base/ButtonUnstyled';
import { styled } from '@mui/system';
import Stack from '@mui/material/Stack';

const blue = {
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
};

export const CustomButton = styled(ButtonUnstyled)`
  font-family: IBM Plex Sans, sans-serif;
  font-weight: 400;
  font-size: 1.275rem;
  background-color: ${blue[500]};
  padding: 12px 24px;
  border-radius: 14px;
  color: white;
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
  align-items: center;
  justify-content: center;
  width: 430px;
  line-height: 1.8;
  margin: 10px;

  &:hover {
    background-color: ${blue[600]};
  }

  &.${buttonUnstyledClasses.active} {
    background-color: ${blue[700]};
  }

  &.${buttonUnstyledClasses.focusVisible} {
    box-shadow: 0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 5px rgba(0, 127, 255, 0.5);
    outline: none;
  }

  &.${buttonUnstyledClasses.disabled} {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

