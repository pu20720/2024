import { Icons } from '@/utils/Icons';
import React, { useState } from 'react'

const navExtentionItems: { icon: React.ReactNode, text: string }[] = [
   { icon: Icons.explorer, text: 'EXPLORER' },
   // { icon: Icons.search, text: 'SEARCH' },
   // { icon: Icons.github, text: 'GITHUB' },
   // { icon: Icons.chat, text: 'CHAT' },
];

const navPreferenceItems: { icon: React.ReactNode, text: string }[] = [
   { icon: Icons.account, text: 'ACCOUNT' },
   // { icon: Icons.setting, text: 'SETTING' },
];

interface ExtentionNavItemProps {
   onSelectedItemChange: (lable: string) => void;
}

const ExtentionNavItem = ({ onSelectedItemChange }: ExtentionNavItemProps) => {

   const [selectedItem, setSelectedItem] = useState<number>(0);

   const handleSelectedItemChange = (index: number) => {
      setSelectedItem(index);
      onSelectedItemChange(navExtentionItems[index].text);
   };


   return (
      <div className='h-screen pb-2 text-3xl bg-slate-800 flex flex-col items-center justify-between'>
         <div>
            {navExtentionItems.map((item, index) => (
               <div
                  key={index}
                  className={`w-fit ${index === selectedItem ? ' border-slate-100 text-gray-100' : 'text-gray-400'}`}
                  onClick={() => handleSelectedItemChange(index)}
               >
                  <div className={`p-2 mx-2 my-4 hover:text-gray-100 ${index === selectedItem ? 'rounded-md bg-slate-600' : 'text-gray-400'}`}>
                     {item.icon}
                  </div>
               </div>
            ))}
         </div>
         <div>
            {navPreferenceItems.map((item, index) => (
               <div
                  key={index}
                  className='w-fit py-3 px-4 text-gray-400 hover:text-gray-100'
               >
                  {item.icon}
               </div>
            ))}
         </div>
      </div>
   )
}

export default ExtentionNavItem