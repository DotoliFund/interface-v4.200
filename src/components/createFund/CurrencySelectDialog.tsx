import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { blue } from '@mui/material/colors';


const tokens = ['ETH', 'WBTC', 'DAI', 'USDC'];

export interface CurrencySelectDialogProps {
  open: boolean;
  selectedCurrency: string;
  onClose: (value: string) => void;
}

export default function CurrencySelectDialog(props: CurrencySelectDialogProps) {
  const { onClose, selectedCurrency, open } = props;

  const handleClose = () => {
    onClose(selectedCurrency);
  };

  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Select a token</DialogTitle>
      <List sx={{ pt: 0 }}>
        {tokens.map((token) => (
          <ListItem button onClick={() => handleListItemClick(token)} key={token}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={token} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}