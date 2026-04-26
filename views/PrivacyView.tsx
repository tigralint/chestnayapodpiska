import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SEO } from '../components/ui/SEO';

export default function PrivacyView() {
  return (
    <div className="flex flex-col h-full px-4 sm:px-6 pb-12">
      <SEO
        title="Политика конфиденциальности | ЧестнаяПодписка"
        description="Политика конфиденциальности сервиса ЧестнаяПодписка. Порядок обработки данных, перечень третьих лиц, права пользователей."
        jsonLd={useMemo(() => ({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Политика конфиденциальности',
        }), [])}
      />
      <div className="max-w-4xl mx-auto w-full">
        <PageHeader
          title="Политика конфиденциальности"
          subtitle="Порядок обработки данных при использовании Сервиса."
          theme="cyan"
        />

        <div className="space-y-10 real-glass-panel p-6 sm:p-10 rounded-[2.5rem] opacity-0 animate-slide-up mt-8 text-slate-200 leading-relaxed text-[15px]" style={{ animationDelay: '150ms' }}>

          {/* 1. Общие положения */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Общие положения</h2>
            <p>
              1.1. Настоящая Политика конфиденциальности (далее – Политика) определяет порядок обработки и защиты данных, получаемых при использовании сервиса «ЧестнаяПодписка», расположенного по адресу{' '}
              <a href="https://chestnayapodpiska.vercel.app" className="text-accent-cyan hover:underline" target="_blank" rel="noopener noreferrer">chestnayapodpiska.vercel.app</a>{' '}
              (далее – Сайт, Сервис).
            </p>
            <p>
              1.2. Администратор Сайта – Мкртчян Тигран Хачатурович, физическое лицо (далее – Администрация).
            </p>
            <p>
              1.3. Сайт не является оператором персональных данных в понимании Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных». Администрация не осуществляет целенаправленный сбор, систематизацию и хранение сведений, позволяющих идентифицировать личность Пользователя.
            </p>
            <p>
              1.4. Настоящая Политика является неотъемлемой частью{' '}
              <Link to="/terms" className="text-accent-cyan hover:underline">Пользовательского соглашения</Link>.
              Начиная использовать Сервис, Пользователь подтверждает, что ознакомлен с условиями настоящей Политики.
            </p>
          </section>

          {/* 2. Какие данные обрабатываются */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. Перечень обрабатываемых данных</h2>
            <p>
              При использовании Сервиса могут обрабатываться следующие категории данных:
            </p>

            <h3 className="text-white font-semibold mt-4">2.1. Данные, вводимые Пользователем в формы Сайта</h3>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li>Наименование организации (сервиса), сумма, дата, описание ситуации – при генерации претензий;</li>
              <li>Текстовые сообщения и изображения – при использовании ИИ-ассистента;</li>
              <li>Наименование сервиса, город, сумма, описание, категория – при отправке сигнала на Народный Радар;</li>
              <li>Описание проблемы и контактные данные (по желанию Пользователя) – при сообщении о дарк-паттерне.</li>
            </ul>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl my-3">
              <p className="text-emerald-200 text-sm">
                <strong>Важно:</strong> Администрация настоятельно рекомендует не вводить в формы Сайта сведения, позволяющие идентифицировать личность (ФИО, паспортные данные, номера банковских карт, адреса). Такие данные следует добавлять самостоятельно в скачанный документ на локальном устройстве.
              </p>
            </div>

            <h3 className="text-white font-semibold mt-4">2.2. Технические данные</h3>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li><strong>IP-адрес</strong> – используется для ограничения частоты запросов (rate limiting). При передаче в систему мониторинга IP-адрес предварительно хэшируется (SHA-256) и не подлежит обратной расшифровке;</li>
              <li><strong>Данные о браузере</strong> (User-Agent, цифровой отпечаток) – обрабатываются сервисом Cloudflare Turnstile для защиты от автоматизированных запросов;</li>
              <li><strong>Анонимизированная аналитика</strong> – данные о посещении страниц (без идентификации личности) обрабатываются сервисами Vercel Analytics и Speed Insights.</li>
            </ul>

            <h3 className="text-white font-semibold mt-4">2.3. Данные, хранящиеся в браузере Пользователя</h3>
            <p>
              Сайт использует технологию <code className="text-accent-cyan bg-white/5 px-1.5 py-0.5 rounded">localStorage</code> для хранения следующих сведений исключительно на устройстве Пользователя:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li>История диалога с ИИ-ассистентом (автоматически удаляется через 24 часа, без изображений);</li>
              <li>Флаг прохождения приветственного экрана (onboarding).</li>
            </ul>
            <p>
              Указанные данные не передаются на сервер Администрации и доступны только Пользователю. Для их удаления достаточно очистить данные сайта в настройках браузера.
            </p>
          </section>

          {/* 3. Цели обработки */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. Цели обработки данных</h2>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li>Обеспечение работоспособности Сервиса (генерация текстов, работа ИИ-ассистента) путём передачи обезличенных данных на обработку в искусственный интеллект через Google Gemini API;</li>
              <li>Защита от автоматизированных запросов, DDoS-атак и злоупотреблений (Cloudflare Turnstile, rate limiting);</li>
              <li>Модерация пользовательских сигналов на Народном Радаре;</li>
              <li>Анализ агрегированной статистики посещений для улучшения Сервиса.</li>
            </ul>
          </section>

          {/* 4. Третьи лица */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Третьи лица, участвующие в обработке данных</h2>
            <p>
              Для обеспечения работы Сервиса данные могут передаваться следующим третьим лицам:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white font-semibold">Получатель</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Передаваемые данные</th>
                    <th className="text-left py-3 px-4 text-white font-semibold">Цель</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-medium text-white">Google LLC</td>
                    <td className="py-3 px-4">Текст запросов, изображения</td>
                    <td className="py-3 px-4">Генерация ответов (Gemini API)</td>
                  </tr>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium text-white">Cloudflare Inc.</td>
                    <td className="py-3 px-4">IP-адрес, цифровой отпечаток</td>
                    <td className="py-3 px-4">Защита от ботов (Turnstile)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-medium text-white">Vercel Inc.</td>
                    <td className="py-3 px-4">IP-адрес, данные о посещениях</td>
                    <td className="py-3 px-4">Хостинг, аналитика</td>
                  </tr>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium text-white">Upstash Inc.</td>
                    <td className="py-3 px-4">IP-адрес (как ключ)</td>
                    <td className="py-3 px-4">Ограничение частоты запросов</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Telegram FZ-LLC</td>
                    <td className="py-3 px-4">Хэш IP, содержание репортов</td>
                    <td className="py-3 px-4">Модерация Радара</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Трансграничная передача */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Трансграничная передача данных</h2>
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
              <p className="text-amber-200">
                5.1. Для обеспечения работы Сервиса введённые Пользователем данные могут передаваться на серверы, расположенные за пределами Российской Федерации, в том числе на территории США (Google LLC, Cloudflare Inc., Vercel Inc.) и Евросоюза (Upstash Inc., Франкфурт).
              </p>
            </div>
            <p>
              5.2. Используя Сервис, Пользователь выражает информированное согласие на трансграничную передачу данных указанным третьим лицам в целях, предусмотренных разделом 3 настоящей Политики.
            </p>
          </section>

          {/* 6. Сроки хранения */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">6. Сроки хранения данных</h2>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li><strong>Данные генерации претензий</strong> – не сохраняются на сервере после завершения запроса. Результат существует только в браузере Пользователя;</li>
              <li><strong>Сообщения ИИ-ассистента</strong> – хранятся в localStorage браузера не более 24 часов;</li>
              <li><strong>Данные Народного Радара</strong> – хранятся в базе данных (Upstash Redis) на срок, необходимый для функционирования ленты сигналов;</li>
              <li><strong>Ключи rate limiting</strong> – автоматически удаляются по истечении лимитного окна (от 1 часа до 1 суток в зависимости от эндпоинта);</li>
              <li><strong>Данные Vercel Analytics</strong> – хранятся в анонимизированном виде в соответствии с политикой конфиденциальности Vercel Inc.</li>
            </ul>
          </section>

          {/* 7. Права пользователя */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">7. Права Пользователя</h2>
            <p>
              7.1. Пользователь вправе в любой момент:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li>Очистить историю чата с ИИ-ассистентом с помощью встроенной кнопки или путём очистки данных сайта в настройках браузера;</li>
              <li>Прекратить использование Сервиса, что будет расцениваться как отзыв согласия на обработку данных;</li>
              <li>Обратиться к Администрации с запросом об удалении данных, связанных с его сигналами на Народном Радаре.</li>
            </ul>
            <p>
              7.2. Поскольку Сайт не осуществляет идентификацию Пользователей (отсутствуют учётные записи, логины, пароли), реализация права на доступ к персональным данным и их исправление в смысле ст. 14 Федерального закона № 152-ФЗ технически невозможна.
            </p>
          </section>

          {/* 8. Безопасность */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">8. Меры безопасности</h2>
            <p>
              Администрация принимает следующие меры для защиты обрабатываемых данных:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-slate-500">
              <li>Передача данных осуществляется исключительно по защищённому протоколу HTTPS;</li>
              <li>Применяются политики Content Security Policy (CSP) для защиты от XSS-атак;</li>
              <li>IP-адреса хэшируются (SHA-256) перед передачей в системы мониторинга;</li>
              <li>Технические логи и лимиты запросов временно хранятся в защищенной базе данных Upstash Redis;</li>
              <li>API-ключи передаются через защищённые заголовки, а не через URL;</li>
              <li>Реализована защита от автоматизированных запросов (Cloudflare Turnstile) и ограничение частоты запросов (Rate Limiting).</li>
            </ul>
          </section>

          {/* 9. Контакты */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">9. Контактная информация</h2>
            <p>
              По вопросам, связанным с обработкой данных, Пользователь может обратиться к Администрации по адресу электронной почты:{' '}
              <a href="mailto:mkrtchyanth@my.msu.ru" className="text-accent-cyan hover:underline">mkrtchyanth@my.msu.ru</a>.
              Срок рассмотрения обращений составляет 30 (тридцать) календарных дней с момента получения.
            </p>
          </section>

          {/* 10. Изменение политики */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">10. Изменение Политики</h2>
            <p>
              10.1. Администрация вправе вносить изменения в настоящую Политику без предварительного уведомления Пользователей. Актуальная редакция всегда доступна по адресу{' '}
              <Link to="/privacy" className="text-accent-cyan hover:underline">/privacy</Link>.
            </p>
            <p>
              10.2. Продолжение использования Сервиса после внесения изменений означает согласие Пользователя с обновлённой редакцией Политики.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 mt-4 text-sm text-slate-400 flex flex-col sm:flex-row sm:justify-between gap-2">
            <p>Дата публикации: 25 апреля 2026 г.</p>
            <Link to="/terms" className="text-accent-cyan hover:underline">→ Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
