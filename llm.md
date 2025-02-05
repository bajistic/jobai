how does terminal cmd work in  nvim
-- Terminal commands can be executed in Neovim via several methods:

-- Ex command using :!
:!ls

-- Run shell command and read output into current buffer
:read !ls

-- Open terminal in a split window
:split term://bash

-- Open terminal in a new tab
:tabnew term://bash

-- Key mapping to toggle terminal (add to init.lua)
vim.keymap.set('n', '<leader>t', ':split term://bash<CR>', { noremap = true })

-- Terminal buffer specific mappings
-- <C-\><C-n> to exit terminal mode
-- i or a to enter terminal mode

-- Toggle terminal function example
function _G.toggle_terminal()
  local terms = {}
  for _, buf in ipairs(vim.api.nvim_list_bufs()) do
    if vim.bo[buf].buftype == 'terminal' then
      table.insert(terms, buf)
    end
  end
  
  if #terms == 0 then
    vim.cmd('split term://bash')
  else
    local term_win = nil
    for _, win in ipairs(vim.api.nvim_list_wins()) do
      if vim.api.nvim_win_get_buf(win) == terms[1] then
        term_win = win
        break
      end
    end
    
    if term_win then
      vim.api.nvim_win_hide(term_win)
    else
      vim.cmd('split')
      vim.api.nvim_win_set_buf(0, terms[1])
    end
  end
end

-- Map terminal toggle function
vim.keymap.set('n', '<leader>t', toggle_terminal, { noremap = true })


<C-n> doesnt work to exit terminal mode
Here's the corrected terminal configuration for Neovim that addresses the terminal mode exit issue:

function _G.toggle_terminal()
  local terms = {}
  for _, buf in ipairs(vim.api.nvim_list_bufs()) do
    if vim.bo[buf].buftype == 'terminal' then
      table.insert(terms, buf)
    end
  end
  
  if #terms == 0 then
    vim.cmd('split term://bash')
    -- Set terminal mode mappings
    vim.cmd([[
      tnoremap <Esc> <C-\><C-n>
      tnoremap <C-[> <C-\><C-n>
    ]])
  else
    local term_win = nil
    for _, win in ipairs(vim.api.nvim_list_wins()) do
      if vim.api.nvim_win_get_buf(win) == terms[1] then
        term_win = win
        break
      end
    end
    
    if term_win then
      vim.api.nvim_win_hide(term_win)
    else
      vim.cmd('split')
      vim.api.nvim_win_set_buf(0, terms[1])
    end
  end
end

-- Terminal specific settings
vim.api.nvim_create_autocmd('TermOpen', {
  pattern = '*',
  callback = function()
    -- Enable insert mode when terminal opens
    vim.cmd('startinsert')
    -- Set local keymaps for terminal buffer
    vim.keymap.set('t', '<Esc>', '<C-\\><C-n>', { buffer = true })
    vim.keymap.set('t', '<C-[>', '<C-\\><C-n>', { buffer = true })
  end
})

-- Map terminal toggle function
vim.keymap.set('n', '<leader>t', toggle_terminal, { noremap = true })

-- Additional terminal settings
vim.opt.shell = '/bin/bash'
vim.opt.splitbelow = true
vim.opt.splitright = true

