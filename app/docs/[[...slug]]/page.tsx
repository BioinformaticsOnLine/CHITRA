import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { ExampleDrawerTrigger } from '@/components/doc-components/example-drawer-trigger';
import { CsvPreviewDrawer } from '@/components/doc-components/csv-preview-drawer';
//import { metadataImage } from '@/lib/metadata';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = (page.data as any).body;

  return (
    <DocsPage
      toc={(page.data as any).toc}
      full={(page.data as any).full}
      tableOfContent={{
        style: 'clerk',
        enabled: true
      }}
      tableOfContentPopover={{
        style: 'clerk',
        enabled: true
      }}
      editOnGithub={{
        owner: 'pranjalpruthi',
        repo: 'CHITRA',
        sha: 'main',
        path: `content/docs/${(page.data as any)._file?.path || ''}`
      }}
    >
      <DocsTitle>{(page.data as any).title}</DocsTitle>
      <DocsDescription>{(page.data as any).description}</DocsDescription>
      <DocsBody>
        <MDX components={{
          ...defaultMdxComponents,
          img: (props: any) => <ImageZoom {...props} />,
          ExampleDrawerTrigger,
          CsvPreviewDrawer
        }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  //return metadataImage.withImage(page.slugs, {
  //title: page.data.title,
  //description: page.data.description,
  //});
}