<script lang="ts">
    import {SITE_MENU} from "@/consts";
    import {onDestroy, onMount} from 'svelte';
    import type {OptionalValue} from "@/utils/types";

    /*interface Props {
        avatar?: import('svelte').Snippet;
    }

    let { avatar }: Props = $props();*/

    const navBarClassNameBase = "absolute -translate-x-2/4 left-2/4 h-[var(--navBar-height)] md:h-[inherit] backdrop-blur-2xl bg-white/80 dark:bg-primary-950 dark:bg-primary-950/80 shadow-2xl [transition:top_150ms,height_400ms_cubic-bezier(.47,1.64,.41,.8),width_300ms] overflow-clip";
    const navBarClassNameTop = "rounded-[2.25rem] top-4";
    const navBarClassNameNormal = "w-full top-0 shadow-[rgba(0,0,0,0.15)]";
    const navBarWidthExpanded = "w-[calc(100dvw-2rem)] md:w-[42rem]";
    const navBarWidthNormal = "w-[calc(100dvw-2rem)] md:w-max";

    // 移动端菜单 a11y ID
    const mobileMenuId = "koi-mobile-menu-list";

    // 高度基准数值 (rem)
    const mobileNavBaseHeight = 4.5;
    const mobileMenuBaseHeight = 1.5;
    const mobileMenuItemHeight = 3.5;

    // 外部参考元素
    let navBackground: OptionalValue<HTMLElement> = $state();
    let navScrollNotice: OptionalValue<HTMLElement> = $state();

    // 状态机
    let navBarClassName = $state(navBarClassNameTop);
    let navBarWidth = $state(navBarWidthNormal);
    let mobileMenuOpen = $state(false);
    let mobileNavHeight = $state(mobileNavBaseHeight);
    let searchOpen = $state(false);
    let searchQuery = $state('');
    let searchInputRef: HTMLInputElement;
    let searchResults = $state<Array<{title: string, slug: string, description?: string}>>([]);
    let isSearching = $state(false);

    // 为什么要这么麻烦的计算导航栏的高度呢？
    // 因为如果不手动指定高度，浏览器不知道你要过渡到什么高度，就会导致 transition 失效
    // 参考 https://stackoverflow.com/questions/3508605/how-can-i-transition-height-0-to-height-auto-using-css
    $effect(() => {
        if (mobileMenuOpen) {
            mobileNavHeight = mobileNavBaseHeight + mobileMenuBaseHeight + (mobileMenuItemHeight * SITE_MENU.length);
        } else {
            mobileNavHeight = mobileNavBaseHeight;
        }
    })

    // 搜索功能
    $effect(() => {
        if (searchQuery.trim()) {
            isSearching = true;
            // 使用防抖延迟搜索
            const timer = setTimeout(async () => {
                try {
                    // 从页面获取所有文章数据
                    const response = await fetch('/api/search.json');
                    if (response.ok) {
                        const allPosts = await response.json();
                        const query = searchQuery.toLowerCase();
                        searchResults = allPosts.filter((post: any) => 
                            post.title.toLowerCase().includes(query) ||
                            post.description?.toLowerCase().includes(query)
                        ).slice(0, 5); // 只显示前5个结果
                    }
                } catch (error) {
                    console.error('搜索失败:', error);
                    searchResults = [];
                } finally {
                    isSearching = false;
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            searchResults = [];
            isSearching = false;
        }
    })

    function handleScroll() {
        if (navBackground && window.scrollY > navBackground.getBoundingClientRect().height * (1 / 1.618)) {
            navBarClassName = navBarClassNameNormal;
            if (!searchOpen) {
                navBarWidth = "";
            }
        } else {
            navBarClassName = navBarClassNameTop;
            if (!searchOpen) {
                navBarWidth = navBarWidthNormal;
            }
        }
        if (navScrollNotice) {
            if (window.scrollY > 64) {
                navScrollNotice.classList.add("opacity-0");
            } else {
                navScrollNotice.classList.remove("opacity-0");
            }
        }
    }

    function toggleSearch() {
        searchOpen = !searchOpen;
        if (searchOpen) {
            // 打开搜索时,设置为搜索展开宽度并添加圆角
            navBarWidth = navBarWidthExpanded;
            navBarClassName = navBarClassNameTop;
            setTimeout(() => {
                searchInputRef?.focus();
            }, 100);
        } else {
            searchQuery = '';
            // 关闭搜索时,根据当前滚动位置恢复正确的状态
            if (navBackground && window.scrollY > navBackground.getBoundingClientRect().height * (1 / 1.618)) {
                navBarWidth = "";
                navBarClassName = navBarClassNameNormal;
            } else {
                navBarWidth = navBarWidthNormal;
                navBarClassName = navBarClassNameTop;
            }
        }
    }

    // 移动端菜单按钮及动画
    let menuTimer: any;
    let menuItemTimer: any;

    let menuStep = $state(1);
    let menuStepMiddle = $state(1);
    let menuItemHidden = $state(true);

    function handleMobileMenuToggle(to = !mobileMenuOpen) {
        mobileMenuOpen = to;
        clearTimeout(menuTimer);
        clearTimeout(menuItemTimer);
        menuStep = 2;

        // 如果菜单已经打开，执行开启动画，反之执行关闭动画
        if (mobileMenuOpen) {
            menuStepMiddle = 1;
            menuTimer = setTimeout(() => {
                menuStep = 3;
                menuStepMiddle = 2;
            }, 200);
            menuItemHidden = false;
        } else {
            menuStepMiddle = 2;
            menuTimer = setTimeout(() => {
                menuStep = 1;
                menuStepMiddle = 1;
            }, 200);
            menuItemTimer = setTimeout(() => {
                menuItemHidden = true;
            }, 400);
        }
    }

    onMount(() => {
        navBackground = document.getElementById("navBackground");
        navScrollNotice = document.getElementById("navScrollNotice");
        globalThis?.addEventListener?.("scroll", handleScroll);
        handleScroll();
    });

    onDestroy(() => {
        clearTimeout(menuTimer);
        clearTimeout(menuItemTimer);
        globalThis?.removeEventListener?.("scroll", handleScroll);
    });
</script>

<nav class="fixed w-full top-0 z-40">
    <div id="navBar" class={navBarClassNameBase + " " + navBarClassName + " " + navBarWidth} style={`--navBar-height: ${mobileNavHeight}rem`}>
        <div class="flex justify-between md:justify-center items-center gap-8 ps-3 pe-3 py-3">
            <a href="./" class="block flex-none" title="首页">
                <!-- <img src={SITE_AUTHOR_AVATAR} alt="Avatar" class="block w-12 h-12 rounded-full"> -->
                <slot name="avatar"></slot>
            </a>
            
            {#if searchOpen}
                <!-- 搜索模式 -->
                <div class="flex-1 flex items-center gap-2 px-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-400 flex-none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        bind:this={searchInputRef}
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索文章..."
                        class="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-base"
                        onkeydown={(e) => {if (e.key === 'Escape') toggleSearch();}}
                    />
                    {#if searchQuery}
                        <button onclick={() => searchQuery = ''} aria-label="清除搜索" class="flex-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    {/if}
                </div>
                <button onclick={toggleSearch} aria-label="关闭搜索" class="w-12 h-12 flex-none flex items-center justify-center rounded-full text-black dark:text-white transition-colors bg-white/0 active:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[1.25rem] h-[1.25rem]">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            {:else}
                <!-- 正常菜单模式 -->
                <ul class="hidden md:contents">
                    {#each SITE_MENU as e}
                        <li class="contents">
                            <a class="text-base leading-6 h-6 block text-black dark:text-white hover:text-accent-600 dark:hover:text-accent-500 transition-colors duration-200 flex-none"
                               href={e.href} target={e.target}>{e.title}</a>
                        </li>
                    {/each}
                </ul>
                <div class="flex flex-none">
                    <button onclick={toggleSearch}
                       aria-label="搜索"
                       class="w-12 h-12 flex items-center justify-center rounded-full -ms-3 text-black dark:text-white transition-colors bg-white/0 active:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[1.25rem] h-[1.25rem]">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                    <a aria-label="在 Twitter 上关注我"
                       class="w-12 h-12 flex items-center justify-center rounded-full text-black dark:text-white transition-colors bg-white/0 active:bg-white/10"
                       href="https://twitter.com/Mashiro_233"
                       target="_blank">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-[1.25rem] h-[1.25rem]">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                    </a>
                    <button onclick={() => handleMobileMenuToggle()}
                            aria-label="打开菜单"
                            aria-controls={mobileMenuId}
                            aria-expanded={mobileMenuOpen}
                            class="w-12 h-12 md:hidden flex items-center justify-center rounded-full md:-ms-3 transition-colors bg-white/0 active:bg-white/10">
                        <span class="block relative w-5 h-5" aria-hidden="true">
                            <span class={`duration-200 block w-5 h-[0.225rem] bg-black dark:bg-white rounded-full burger-bar-1 burger-bar-1--s${menuStep} absolute left-1/2`}></span>
                            <span class={`duration-200 block w-5 h-[0.225rem] bg-black dark:bg-white rounded-full burger-bar-2 burger-bar-2--s${menuStepMiddle} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}></span>
                            <span class={`duration-200 block w-5 h-[0.225rem] bg-black dark:bg-white rounded-full burger-bar-3 burger-bar-3--s${menuStep} absolute left-1/2`}></span>
                        </span>
                    </button>
                </div>
            {/if}
        </div>
        <div class={`flex flex-col items-center md:hidden ${menuItemHidden ? "hidden" : ""}`} id={mobileMenuId}>
            <hr class={`w-[calc(100%-1.5rem)] transition-colors duration-400 ${mobileMenuOpen ? "border-black/10 dark:border-white/10" : "border-transparent"}`}>
            <ul class="w-full p-3">
                {#each SITE_MENU as e}
                    <li class="contents">
                        <a onclick={() => handleMobileMenuToggle(false)}
                           class="text-xl leading-6 h-14 flex items-center justify-center text-black dark:text-white hover:text-accent-600 dark:hover:text-accent-500 transition-colors duration-200 flex-none"
                           href={e.href} target={e.target}>{e.title}</a>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</nav>

<!-- 搜索结果面板 -->
{#if searchOpen && (searchQuery || isSearching)}
    <div class="fixed top-[5.5rem] left-1/2 -translate-x-1/2 w-[calc(100dvw-2rem)] md:w-[42rem] backdrop-blur-2xl bg-white/80 dark:bg-primary-900/80 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 max-h-[70vh] overflow-y-auto z-30">
        {#if isSearching}
            <div class="p-6 text-center text-zinc-500 dark:text-zinc-400">
                <div class="inline-block w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin"></div>
                <p class="mt-2">搜索中...</p>
            </div>
        {:else if searchResults.length > 0}
            <div class="p-3">
                <p class="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">找到 {searchResults.length} 个结果</p>
                {#each searchResults as result}
                    <a href={`/post/${result.slug}/`} 
                       class="block p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                       onclick={() => toggleSearch()}>
                        <h3 class="text-base font-medium text-zinc-800 dark:text-zinc-100">{result.title}</h3>
                        {#if result.description}
                            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{result.description}</p>
                        {/if}
                    </a>
                {/each}
            </div>
        {:else if searchQuery}
            <div class="p-6 text-center text-zinc-500 dark:text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 opacity-30">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>未找到相关文章</p>
                <p class="text-sm mt-2">试试 <a href="/page/archive" class="text-accent-600 dark:text-accent-500 hover:underline">归档页面</a> 或 <a href="/page/tags" class="text-accent-600 dark:text-accent-500 hover:underline">标签页面</a></p>
            </div>
        {/if}
    </div>
{/if}

<style>
    .burger-bar-1--s1 {
        top: 0;
        transform: translate(-50%, 0);
    }
    .burger-bar-1--s2 {
        top: 50%;
        transform: translate(-50%, -50%);
    }
    .burger-bar-1--s3 {
        top: 50%;
        transform: translate(-50%, -50%) rotate(45deg) scale(1.3);
        height: 0.2rem;
    }
    .burger-bar-2--s1 {
        display: block;
    }
    .burger-bar-2--s2 {
        display: none;
    }
    .burger-bar-3--s1 {
        bottom: 0;
        transform: translate(-50%, 0);
    }
    .burger-bar-3--s2 {
        bottom: 50%;
        transform: translate(-50%, 50%);
    }
    .burger-bar-3--s3 {
        bottom: 50%;
        transform: translate(-50%, 50%) rotate(-45deg) scale(1.3);
        height: 0.2rem;
    }
</style>
