import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAdresserFromSearchText } from '../api/getAdresserFromSearchText';

export type Address = {
  PayLoad: {
    Posisjon: {
      X: number;
      Y: number;
    };
    Text: string;
  };
};

export const SearchBar = ({
  setAddress,
  label = 'Adressesøk',
  text,
}: {
  setAddress: (address: Address | null) => void;
  label?: string;
  /** Tekst som skal stå i feltet når punktet er valgt på annen måte (f.eks. klikk i kartet). */
  text?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(text ?? '');

  useEffect(() => {
    if (text !== undefined) setSearchText(text);
  }, [text]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let active = true;
    setOptions([]);
    setLoading(true);
    const identifier = setTimeout(async () => {
      const adresser: Address[] = await getAdresserFromSearchText(query.trim());
      if (!active) return;
      setOptions(adresser);
      setLoading(false);
    }, 350);

    return () => {
      active = false;
      clearTimeout(identifier);
    };
  }, [query]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Autocomplete
      sx={{ width: '100%' }}
      size="small"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={handleClose}
      filterOptions={(items) => items}
      clearOnBlur={false}
      isOptionEqualToValue={(option, value) => option.PayLoad.Text === value.PayLoad.Text && option.PayLoad.Posisjon.X === value.PayLoad.Posisjon.X && option.PayLoad.Posisjon.Y === value.PayLoad.Posisjon.Y}
      loadingText="Søker etter adresser …"
      noOptionsText={query.trim() ? 'Ingen adresser funnet' : 'Skriv inn en adresse'}
      getOptionLabel={(option) => option.PayLoad.Text}
      options={options}
      loading={loading}
      inputValue={searchText}
      onInputChange={(_, newInputValue, reason) => {
        setSearchText(newInputValue);
        if (reason === 'input' || reason === 'clear') {
          setQuery(newInputValue);
          setOpen(reason === 'input');
        }
      }}
      onChange={(_, selectedOption) => {
        setAddress(selectedOption);
        if (selectedOption) {
          setOpen(false);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};
