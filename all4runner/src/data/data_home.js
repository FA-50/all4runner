import React from 'react';
import logo1 from '../img/uosmark1.svg'
import logo2 from "../img/uosmark2.svg"

import {
  FaHome,
  FaMap,
} from 'react-icons/fa';
export const links = [
  {
    id: 1,
    url: '/',
    text: 'home',
    icon: <FaHome />,
  },
  {
    id: 2,
    url: '/map',
    text: 'Map',
    icon: <FaMap />,
  }
];

export const social = [
  {
    id: 1,
    url: 'https://www.uos.ac.kr/',
    icon: <img src={logo1} width="48" height="auto" alt="uos"/>,
  },
  {
    id: 2,
    url: 'https://www.uos.ac.kr/urbansciences/geoinfo/main.do?identified=anonymous&',
    icon: <img src={logo2} width="60" height="auto" alt="geo"/>,
  },
];