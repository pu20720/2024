import React from 'react';
import { FcDocument } from "react-icons/fc";
import Image from 'next/image';
import {
  VscAccount,
  VscComment,
  VscFiles,
  VscGithub,
  VscSearch,
  VscSettingsGear
} from 'react-icons/vsc';


import javascript from 'programming-languages-logos/src/javascript/javascript.svg'
import c from 'programming-languages-logos/src/c/c.svg'
import cpp from 'programming-languages-logos/src/cpp/cpp.svg'
import python from 'programming-languages-logos/src/python/python.svg'


export const Icons = {
  account: <VscAccount />,
  chat: <VscComment />,
  explorer: <VscFiles />,
  github: <VscGithub />,
  search: <VscSearch />,
  setting: <VscSettingsGear />,
};

export const LanguageIcons = {
  c: <Image
    src={c}
    alt={''}
    width={17}
    height={17}
    style={{ objectFit: 'cover' }} />,
  cpp: <Image
    src={cpp}
    alt={''}
    width={17}
    height={17}
    style={{ objectFit: 'cover' }} />,
  python: <Image
    src={python}
    alt={''}
    width={17}
    height={17}
    style={{ objectFit: 'cover' }} />,
  javascript: <Image
    src={javascript}
    alt={''}
    width={17}
    height={17}
    style={{ objectFit: 'cover' }} />,
  text: <FcDocument
    size={15} />,
}