import * as React from 'react';
import BaseLayout from '../components/layouts/BaseLayout';
import Seo from '../components/Seo';
import { Hero } from '../components/home/Hero';
import { About } from '../components/home/About';
import { Background } from '../components/home/Background';
import { Vision } from '../components/home/Vision';
import { Team } from '../components/home/Team';
import { Navbar } from '../components/Navbar';

const IndexPage: React.FC = () => {
  return (
    <BaseLayout>
      <Hero />
      <About />
      <Background />
      <Vision />
      <Team />
    </BaseLayout>
  );
};

export const Head = () => <Seo title="Home Page" />

export default IndexPage