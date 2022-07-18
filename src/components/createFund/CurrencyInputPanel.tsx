import * as React from 'react';
import InputUnstyled, { InputUnstyledProps, inputUnstyledClasses } from '@mui/base/InputUnstyled';
import { styled } from '@mui/system';
import ButtonUnstyled from '@mui/base/ButtonUnstyled';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CurrencySelectButton from './CurrencySelectButton';
import { useDepositState } from 'state/deposit/hooks'


const blue = {
  100: '#DAECFF',
  200: '#80BFFF',
  400: '#3399FF',
  600: '#0072E5',
};

const grey = {
  50: '#F3F6F9',
  100: '#E7EBF0',
  200: '#E0E3E7',
  300: '#CDD2D7',
  400: '#B2BAC2',
  500: '#A0AAB4',
  600: '#6F7E8C',
  700: '#3E5060',
  800: '#2D3843',
  900: '#1A2027',
};


const StyledInputElement = styled('input')(
  ({ theme }) => `
  width: 270px;
  font-size: 1.475rem;
  font-family: IBM Plex Sans, sans-serif;
  font-weight: 400;
  line-height: 2.6;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 0px;
  border-radius: 18px;
  padding: 12px 12px;
  align-items: center;
  justify-content: center;
  margin: 2px;

  // &:hover {
  //   background: ${theme.palette.mode === 'dark' ? '' : grey[100]};
  //   border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  // }

  &:focus {
    outline: 0px ;
  }
`,
);



const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: IBM Plex Sans, sans-serif;
  display: flex;
  font-weight: 500;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[300]};
  border-radius: 18px;
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  align-items: center;
  justify-content: center;
  margin: 12px;


  &.${inputUnstyledClasses.focused} {
    outline: 1px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[100]};
  }

  // &:hover {
  //   background: ${theme.palette.mode === 'dark' ? '' : grey[100]};
  //   border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  // }
`,
);


const CustomInput = React.forwardRef(function CustomInput(
  props: InputUnstyledProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { components, ...other } = props;
  return (
    <InputUnstyled
      components={{
        Root: StyledInputRoot,
        Input: StyledInputElement,
        ...components,
      }}
      {...other}
      ref={ref}
    />
  );
});

const InputAdornment = styled('div')`
  margin: 4px;
  display: inline-flex;
`;

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onCurrencySelect: (currency: string) => void
  currency: string
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onCurrencySelect,
  currency
} : CurrencyInputPanelProps) {
  return <CustomInput 
          aria-label="Demo input"
          placeholder="0.0"
          value={value}
          onChange={(event) => {
              const value = event.target.value
              onUserInput(value)
            }}
            endAdornment={
            <InputAdornment>
              <CurrencySelectButton
                currency={currency ?? ''}
                onCurrencySelect={onCurrencySelect}
              />
            </InputAdornment>
          }/>;
}












