-- Rename tables
RENAME TABLE `User` TO `Usuario`;
RENAME TABLE `EventType` TO `TipoEvento`;
RENAME TABLE `NewsEvent` TO `Noticia`;

-- Usuario: rename columns and index
ALTER TABLE `Usuario` RENAME COLUMN `name` TO `nome`;
ALTER TABLE `Usuario` RENAME COLUMN `password` TO `senha`;
ALTER TABLE `Usuario` RENAME COLUMN `createdAt` TO `criadoEm`;
ALTER TABLE `Usuario` RENAME COLUMN `updatedAt` TO `atualizadoEm`;
ALTER TABLE `Usuario` RENAME INDEX `User_email_key` TO `Usuario_email_key`;

-- TipoEvento: rename columns and index
ALTER TABLE `TipoEvento` RENAME COLUMN `name` TO `nome`;
ALTER TABLE `TipoEvento` RENAME COLUMN `createdAt` TO `criadoEm`;
ALTER TABLE `TipoEvento` RENAME COLUMN `updatedAt` TO `atualizadoEm`;
ALTER TABLE `TipoEvento` RENAME INDEX `EventType_name_key` TO `TipoEvento_nome_key`;

-- Noticia: drop old foreign key before renaming the referenced column
ALTER TABLE `Noticia` DROP FOREIGN KEY `NewsEvent_eventTypeId_fkey`;

-- Noticia: rename columns and index
ALTER TABLE `Noticia` RENAME COLUMN `title` TO `titulo`;
ALTER TABLE `Noticia` RENAME COLUMN `date` TO `data`;
ALTER TABLE `Noticia` RENAME COLUMN `source` TO `fonte`;
ALTER TABLE `Noticia` RENAME COLUMN `fullText` TO `textoCompleto`;
ALTER TABLE `Noticia` RENAME COLUMN `eventTypeId` TO `tipoEventoId`;
ALTER TABLE `Noticia` RENAME COLUMN `locationText` TO `localizacaoTexto`;
ALTER TABLE `Noticia` RENAME COLUMN `neighborhood` TO `bairro`;
ALTER TABLE `Noticia` RENAME COLUMN `streetOrLandmark` TO `ruaOuPontoDeReferencia`;
ALTER TABLE `Noticia` RENAME COLUMN `peopleAffected` TO `pessoasAfetadas`;
ALTER TABLE `Noticia` RENAME COLUMN `materialDamage` TO `danoMaterial`;
ALTER TABLE `Noticia` RENAME COLUMN `infrastructureIssue` TO `problemaInfraestrutura`;
ALTER TABLE `Noticia` RENAME COLUMN `residentQuote` TO `depoimentoMorador`;
ALTER TABLE `Noticia` RENAME COLUMN `institutionQuote` TO `depoimentoInstituicao`;
ALTER TABLE `Noticia` RENAME COLUMN `sentiment` TO `sentimento`;
ALTER TABLE `Noticia` RENAME COLUMN `themes` TO `temas`;
ALTER TABLE `Noticia` RENAME COLUMN `createdAt` TO `criadoEm`;
ALTER TABLE `Noticia` RENAME COLUMN `updatedAt` TO `atualizadoEm`;
ALTER TABLE `Noticia` RENAME INDEX `NewsEvent_url_key` TO `Noticia_url_key`;

-- Translate the stored sentiment enum values (widen, migrate data, narrow)
ALTER TABLE `Noticia` MODIFY COLUMN `sentimento` ENUM('POSITIVE','NEGATIVE','NEUTRAL','MIXED','POSITIVO','NEGATIVO','NEUTRO','MISTO') NULL;

UPDATE `Noticia` SET `sentimento` = CASE `sentimento`
  WHEN 'POSITIVE' THEN 'POSITIVO'
  WHEN 'NEGATIVE' THEN 'NEGATIVO'
  WHEN 'NEUTRAL' THEN 'NEUTRO'
  WHEN 'MIXED' THEN 'MISTO'
  ELSE `sentimento`
END;

ALTER TABLE `Noticia` MODIFY COLUMN `sentimento` ENUM('POSITIVO','NEGATIVO','NEUTRO','MISTO') NULL;

-- Recreate the foreign key against the renamed table/column
ALTER TABLE `Noticia` ADD CONSTRAINT `Noticia_tipoEventoId_fkey` FOREIGN KEY (`tipoEventoId`) REFERENCES `TipoEvento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
