-- AlterTable
-- Preserva os dados existentes: a coluna data, que misturava publicação e evento,
-- passa a dataPublicacao, e bairro passa a bairroTexto (texto original sem tratamento).
ALTER TABLE `noticia`
    CHANGE COLUMN `bairro` `bairroTexto` TEXT NULL,
    ADD COLUMN `dataPublicacao` DATE NULL,
    ADD COLUMN `dataEvento` DATE NULL,
    ADD COLUMN `origem` ENUM('LEGADO', 'COLETA') NOT NULL DEFAULT 'COLETA',
    ADD COLUMN `candidatoId` INTEGER NULL,
    ADD COLUMN `duplicadaDeId` INTEGER NULL,
    ADD COLUMN `hashTexto` CHAR(64) NULL;

UPDATE `noticia` SET `dataPublicacao` = DATE(`data`), `origem` = 'LEGADO';

ALTER TABLE `noticia` DROP COLUMN `data`;

-- CreateTable
CREATE TABLE `Municipio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigoIbge` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Municipio_codigoIbge_key`(`codigoIbge`),
    UNIQUE INDEX `Municipio_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bairro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `municipioId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `nomeNormalizado` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Bairro_municipioId_nomeNormalizado_key`(`municipioId`, `nomeNormalizado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NoticiaLocal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noticiaId` INTEGER NOT NULL,
    `municipioId` INTEGER NOT NULL,
    `bairroId` INTEGER NULL,
    `textoOriginal` VARCHAR(255) NULL,

    INDEX `NoticiaLocal_noticiaId_idx`(`noticiaId`),
    INDEX `NoticiaLocal_municipioId_idx`(`municipioId`),
    INDEX `NoticiaLocal_bairroId_idx`(`bairroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtefatoBruto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `urlOrigem` VARCHAR(1000) NOT NULL,
    `caminho` VARCHAR(500) NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `httpStatus` INTEGER NULL,
    `contentType` VARCHAR(191) NULL,
    `coletadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExecucaoColeta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chave` VARCHAR(255) NOT NULL,
    `conector` VARCHAR(191) NOT NULL,
    `consulta` TEXT NOT NULL,
    `janelaInicio` DATE NULL,
    `janelaFim` DATE NULL,
    `estado` ENUM('PENDENTE', 'CONCLUIDA', 'SATURADA', 'FALHOU') NOT NULL DEFAULT 'PENDENTE',
    `itensRetornados` INTEGER NULL,
    `erro` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExecucaoColeta_chave_key`(`chave`),
    INDEX `ExecucaoColeta_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chave` CHAR(64) NOT NULL,
    `urlDescoberta` TEXT NOT NULL,
    `urlCanonica` VARCHAR(700) NULL,
    `titulo` VARCHAR(500) NULL,
    `fonteDescoberta` VARCHAR(191) NULL,
    `publicadoEm` DATETIME(3) NULL,
    `execucaoId` INTEGER NULL,
    `estado` ENUM('DESCOBERTO', 'DESCARTADO_TITULO', 'URL_RESOLVIDA', 'FALHA_DECODIFICACAO', 'DUPLICADO_URL', 'BLOQUEADO', 'SEM_TEXTO', 'FORA_TERRITORIO', 'AGUARDANDO_LLM', 'EXTRAIDO', 'IRRELEVANTE', 'FALHA_LLM') NOT NULL DEFAULT 'DESCOBERTO',
    `motivo` TEXT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `ordemFila` BIGINT NOT NULL,
    `textoTratado` MEDIUMTEXT NULL,
    `hashTexto` CHAR(64) NULL,
    `tituloPagina` VARCHAR(500) NULL,
    `dataPublicacao` DATE NULL,
    `artefatoId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Candidato_chave_key`(`chave`),
    UNIQUE INDEX `Candidato_urlCanonica_key`(`urlCanonica`),
    INDEX `Candidato_estado_ordemFila_idx`(`estado`, `ordemFila`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExtracaoLlm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `candidatoId` INTEGER NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `versaoPrompt` VARCHAR(191) NOT NULL,
    `respostaBruta` JSON NULL,
    `sucesso` BOOLEAN NOT NULL,
    `erro` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExtracaoLlm_criadoEm_idx`(`criadoEm`),
    INDEX `ExtracaoLlm_candidatoId_idx`(`candidatoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecursoDefesaCivil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ckanId` VARCHAR(191) NOT NULL,
    `conjunto` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `licenca` VARCHAR(191) NOT NULL,
    `ultimaModificacao` DATETIME(3) NOT NULL,
    `totalDeclarado` INTEGER NULL,
    `totalImportado` INTEGER NOT NULL DEFAULT 0,
    `concluido` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `RecursoDefesaCivil_ckanId_key`(`ckanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtendimentoDefesaCivil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recursoId` INTEGER NOT NULL,
    `idOrigem` INTEGER NOT NULL,
    `regional` VARCHAR(191) NULL,
    `dataSolicitacao` DATE NULL,
    `ocorrencia` VARCHAR(255) NULL,
    `solicitacao` VARCHAR(255) NULL,
    `bairroOriginal` VARCHAR(191) NULL,
    `bairroId` INTEGER NULL,
    `grauRisco` VARCHAR(191) NULL,
    `dataAcao` DATE NULL,
    `tipoAcao` VARCHAR(255) NULL,
    `quantidade` DOUBLE NULL,
    `altura` DOUBLE NULL,
    `largura` DOUBLE NULL,
    `areaM2` DOUBLE NULL,
    `alertas` JSON NULL,

    INDEX `AtendimentoDefesaCivil_dataSolicitacao_bairroId_idx`(`dataSolicitacao`, `bairroId`),
    INDEX `AtendimentoDefesaCivil_solicitacao_idx`(`solicitacao`),
    INDEX `AtendimentoDefesaCivil_bairroId_idx`(`bairroId`),
    UNIQUE INDEX `AtendimentoDefesaCivil_recursoId_idOrigem_key`(`recursoId`, `idOrigem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Noticia_candidatoId_key` ON `noticia`(`candidatoId`);

-- CreateIndex
CREATE INDEX `Noticia_dataPublicacao_idx` ON `noticia`(`dataPublicacao`);

-- CreateIndex
CREATE INDEX `Noticia_tipoEventoId_dataPublicacao_idx` ON `noticia`(`tipoEventoId`, `dataPublicacao`);

-- CreateIndex
CREATE INDEX `Noticia_hashTexto_idx` ON `noticia`(`hashTexto`);

-- AddForeignKey
ALTER TABLE `noticia` ADD CONSTRAINT `Noticia_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidato`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `noticia` ADD CONSTRAINT `Noticia_duplicadaDeId_fkey` FOREIGN KEY (`duplicadaDeId`) REFERENCES `noticia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bairro` ADD CONSTRAINT `Bairro_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `Municipio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoticiaLocal` ADD CONSTRAINT `NoticiaLocal_noticiaId_fkey` FOREIGN KEY (`noticiaId`) REFERENCES `noticia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoticiaLocal` ADD CONSTRAINT `NoticiaLocal_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `Municipio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoticiaLocal` ADD CONSTRAINT `NoticiaLocal_bairroId_fkey` FOREIGN KEY (`bairroId`) REFERENCES `Bairro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidato` ADD CONSTRAINT `Candidato_execucaoId_fkey` FOREIGN KEY (`execucaoId`) REFERENCES `ExecucaoColeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExtracaoLlm` ADD CONSTRAINT `ExtracaoLlm_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtendimentoDefesaCivil` ADD CONSTRAINT `AtendimentoDefesaCivil_recursoId_fkey` FOREIGN KEY (`recursoId`) REFERENCES `RecursoDefesaCivil`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtendimentoDefesaCivil` ADD CONSTRAINT `AtendimentoDefesaCivil_bairroId_fkey` FOREIGN KEY (`bairroId`) REFERENCES `Bairro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

